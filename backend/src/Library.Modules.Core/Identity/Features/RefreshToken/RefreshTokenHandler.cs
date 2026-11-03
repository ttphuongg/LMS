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
        if (!val.IsValid) 
            return ApiResponse<LoginResponse>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var rawToken = request.RefreshToken.Trim();
        var parts = rawToken.Split('.', 2);
        
        LoginSession? session = null;
        string? secret = null;

        if (parts.Length == 2 && long.TryParse(parts[0], out var sessionId))
        {
            secret = parts[1];
            session = await _db.LoginSessions
                .Include(s => s.Account)
                .FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        }
        else
        {
            var recentActive = await _db.LoginSessions
                .Include(s => s.Account)
                .Where(s => s.LoggedOutAt == null && s.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(s => s.LoggedInAt)
                .Take(20)
                .ToListAsync(ct);

            foreach (var s in recentActive)
            {
                if (s.RefreshTokenHash != null && BCrypt.Net.BCrypt.Verify(rawToken, s.RefreshTokenHash))
                {
                    session = s;
                    secret = rawToken;
                    break;
                }
            }
        }

        if (session == null)
            return ApiResponse<LoginResponse>.Fail("Refresh token không hợp lệ hoặc không tồn tại.");

        if (session.LoggedOutAt != null)
        {
            return ApiResponse<LoginResponse>.Fail("Phiên đăng nhập đã bị thu hồi hoặc đã được làm mới trước đó.");
        }

        if (session.ExpiresAt <= DateTime.UtcNow)
            return ApiResponse<LoginResponse>.Fail("Refresh token đã hết hạn.");

        if (secret != null && session.RefreshTokenHash != null && !BCrypt.Net.BCrypt.Verify(secret, session.RefreshTokenHash))
            return ApiResponse<LoginResponse>.Fail("Refresh token không hợp lệ.");

        if (session.Account.Status != AccountStatus.Active)
            return ApiResponse<LoginResponse>.Fail("Tài khoản đã bị khóa hoặc không hoạt động.");

        session.LoggedOutAt = DateTime.UtcNow;

        var accessToken = _jwt.GenerateAccessToken(session.Account);
        var newRefreshTokenSecret = _jwt.GenerateRefreshToken();

        var newSession = new LoginSession
        {
            AccountId = session.AccountId,
            RefreshTokenHash = BCrypt.Net.BCrypt.HashPassword(newRefreshTokenSecret),
            LoggedInAt = DateTime.UtcNow,
            ExpiresAt = _jwt.GetRefreshTokenExpiry()
        };

        _db.LoginSessions.Add(newSession);
        await _db.SaveChangesAsync(ct);

        var newClientRefreshToken = $"{newSession.Id}.{newRefreshTokenSecret}";
        var accessExpiryMinutes = _jwt.GetAccessTokenExpiryMinutes();

        var response = new LoginResponse(
            AccountId: session.Account.Id,
            Username: session.Account.Username,
            FullName: session.Account.FullName,
            Email: session.Account.Email,
            Role: session.Account.Role.ToString(),
            AccessToken: accessToken,
            RefreshToken: newClientRefreshToken,
            AccessTokenExpiresAt: DateTime.UtcNow.AddMinutes(accessExpiryMinutes)
        );

        return ApiResponse<LoginResponse>.Ok(response);
    }
}
