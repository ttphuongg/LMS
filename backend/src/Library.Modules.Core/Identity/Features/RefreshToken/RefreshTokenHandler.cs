using System.Security.Cryptography;
using System.Text;
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
    private readonly IdentityDbContext _db;
    private readonly IValidator<RefreshTokenRequest> _validator;
    private readonly JwtTokenService _jwt;

    public RefreshTokenHandler(IdentityDbContext db, IValidator<RefreshTokenRequest> validator, JwtTokenService jwt)
    {
        _db = db;
        _validator = validator;
        _jwt = jwt;
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    public async Task<ApiResponse<LoginResponse>> Handle(RefreshTokenRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<LoginResponse>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var tokenHash = HashToken(request.RefreshToken);

        // Tra cứu trực tiếp O(1) qua SHA256 hash thay vì quét toàn bộ bảng và verify BCrypt (chống DoS)
        var validSession = await _db.LoginSessions
            .Include(s => s.Account)
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == tokenHash && s.LoggedOutAt == null && s.ExpiresAt > DateTime.UtcNow, ct);

        // Hỗ trợ phiên bản cũ lưu bằng BCrypt (nếu có)
        if (validSession == null)
        {
            var legacySessions = await _db.LoginSessions
                .Include(s => s.Account)
                .Where(s => s.LoggedOutAt == null && s.ExpiresAt > DateTime.UtcNow && s.RefreshTokenHash != null && s.RefreshTokenHash.StartsWith("$2"))
                .OrderByDescending(s => s.LoggedInAt)
                .Take(20)
                .ToListAsync(ct);

            foreach (var s in legacySessions)
            {
                if (BCrypt.Net.BCrypt.Verify(request.RefreshToken, s.RefreshTokenHash))
                {
                    validSession = s;
                    break;
                }
            }
        }

        if (validSession == null)
            return ApiResponse<LoginResponse>.Fail("Refresh token không hợp lệ hoặc đã hết hạn.");

        if (validSession.Account.Status != AccountStatus.Active)
            return ApiResponse<LoginResponse>.Fail("Tài khoản không hoạt động.");

        // Thu hồi session cũ
        validSession.LoggedOutAt = DateTime.UtcNow;

        // Tạo token mới
        var accessToken = _jwt.GenerateAccessToken(validSession.Account);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        var newSession = new LoginSession
        {
            AccountId = validSession.AccountId,
            RefreshTokenHash = HashToken(newRefreshToken),
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
            AccessTokenExpiresAt: _jwt.GetAccessTokenExpiry()
        );

        return ApiResponse<LoginResponse>.Ok(response);
    }
}
