using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.RefreshToken;

public sealed class RefreshTokenHandler : IRequestHandler<RefreshTokenRequest, ApiResponse<LoginResponse>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<RefreshTokenRequest> _validator;
    private readonly JwtTokenService _jwt;

    public RefreshTokenHandler(AppDbContext db, IValidator<RefreshTokenRequest> validator, JwtTokenService jwt)
    {
        _db = db;
        _validator = validator;
        _jwt = jwt;
    }

    public async Task<ApiResponse<LoginResponse>> Handle(RefreshTokenRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<LoginResponse>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var sessions = await _db.LoginSessions
            .Include(s => s.Account)
            .Where(s => s.LoggedOutAt == null && s.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);
            
        LoginSession? validSession = null;
        foreach (var s in sessions)
        {
            if (s.RefreshTokenHash != null && BCrypt.Net.BCrypt.Verify(request.RefreshToken, s.RefreshTokenHash))
            {
                validSession = s;
                break;
            }
        }

        if (validSession == null)
            return ApiResponse<LoginResponse>.Fail("Refresh token không h?p l? ho?c ð? h?t h?n.");

        if (validSession.Account.Status != AccountStatus.Active)
            return ApiResponse<LoginResponse>.Fail("Tài kho?n không ho?t ð?ng.");

        // Revoke old session
        validSession.LoggedOutAt = DateTime.UtcNow;

        // Generate new tokens
        var accessToken = _jwt.GenerateAccessToken(validSession.Account);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        var newSession = new LoginSession
        {
            AccountId = validSession.AccountId,
            RefreshTokenHash = BCrypt.Net.BCrypt.HashPassword(newRefreshToken),
            LoggedInAt = DateTime.UtcNow,
            ExpiresAt = _jwt.GetRefreshTokenExpiry()
        };

        _db.LoginSessions.Add(newSession);
        await _db.SaveChangesAsync(ct);

        var response = new LoginResponse(
            AccountId: validSession.Account.Id,
            Username: validSession.Account.Username,
            FullName: validSession.Account.FullName,
            Email: validSession.Account.Email,
            Role: validSession.Account.Role.ToString(),
            AccessToken: accessToken,
            RefreshToken: newRefreshToken,
            AccessTokenExpiresAt: DateTime.UtcNow.AddMinutes(60)
        );

        return ApiResponse<LoginResponse>.Ok(response);
    }
}
