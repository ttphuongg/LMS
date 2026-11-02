using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.Login;

public sealed class LoginHandler : IRequestHandler<LoginRequest, ApiResponse<LoginResponse>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<LoginRequest> _validator;
    private readonly JwtTokenService _jwt;

    public LoginHandler(AppDbContext db, IValidator<LoginRequest> validator, JwtTokenService jwt)
    {
        _db = db;
        _validator = validator;
        _jwt = jwt;
    }

    public async Task<ApiResponse<LoginResponse>> Handle(LoginRequest request, CancellationToken ct)
    {
        // ── Validate ──────────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<LoginResponse>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Find account ──────────────────────────────────────────────────────
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Username == normalizedUsername, ct);

        if (account is null)
            return ApiResponse<LoginResponse>.Fail("Tên đăng nhập hoặc mật khẩu không đúng.");

        // ── Check status ──────────────────────────────────────────────────────
        if (account.Status == AccountStatus.Locked)
            return ApiResponse<LoginResponse>.Fail("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");

        if (account.Status == AccountStatus.Inactive)
            return ApiResponse<LoginResponse>.Fail("Tài khoản đã bị vô hiệu hóa.");

        // ── Verify password ───────────────────────────────────────────────────
        if (!BCrypt.Net.BCrypt.Verify(request.Password, account.PasswordHash))
            return ApiResponse<LoginResponse>.Fail("Tên đăng nhập hoặc mật khẩu không đúng.");

        // ── Generate tokens ───────────────────────────────────────────────────
        var accessToken = _jwt.GenerateAccessToken(account);
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiry = _jwt.GetRefreshTokenExpiry();

        // ── Persist login session ─────────────────────────────────────────────
        var session = new LoginSession
        {
            AccountId = account.Id,
            RefreshTokenHash = BCrypt.Net.BCrypt.HashPassword(refreshToken),
            LoggedInAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiry
        };

        _db.LoginSessions.Add(session);

        // Update last login timestamp
        account.LastLoginAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // ── Build response ────────────────────────────────────────────────────
        var accessExpiryMinutes = 60; // matches JwtSettings:AccessTokenExpiryMinutes default
        var response = new LoginResponse(
            AccountId: account.Id,
            Username: account.Username,
            FullName: account.FullName,
            Email: account.Email,
            Role: account.Role.ToString(),
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiresAt: DateTime.UtcNow.AddMinutes(accessExpiryMinutes)
        );

        return ApiResponse<LoginResponse>.Ok(response);
    }
}
