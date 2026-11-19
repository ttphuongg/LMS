using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.VerifyEmailOtp;

public sealed class VerifyEmailOtpHandler : IRequestHandler<VerifyEmailOtpRequest, ApiResponse<VerifyEmailOtpResponse>>
{
    private readonly IdentityDbContext _db;
    private readonly IValidator<VerifyEmailOtpRequest> _validator;
    private readonly JwtTokenService _jwt;

    public VerifyEmailOtpHandler(IdentityDbContext db, IValidator<VerifyEmailOtpRequest> validator, JwtTokenService jwt)
    {
        _db = db;
        _validator = validator;
        _jwt = jwt;
    }

    public async Task<ApiResponse<VerifyEmailOtpResponse>> Handle(VerifyEmailOtpRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<VerifyEmailOtpResponse>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Email == normalizedEmail, ct);

        if (account is null)
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Tài khoản không tồn tại trên hệ thống.");

        if (account.Status == AccountStatus.Active)
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Tài khoản này đã được xác thực và kích hoạt trước đó. Vui lòng đăng nhập.");

        if (account.Status == AccountStatus.Locked)
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");

        // Tìm mã OTP mới nhất chưa sử dụng của tài khoản này
        var otpRecord = await _db.EmailVerificationOtps
            .Where(o => o.AccountId == account.Id && o.UsedAt == null)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otpRecord is null)
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");

        // Kiểm tra thời hạn 3 phút
        if (DateTime.UtcNow > otpRecord.ExpiresAt)
        {
            otpRecord.UsedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Mã xác thực đã hết hạn (hiệu lực 3 phút). Vui lòng nhấn Gửi lại mã.");
        }

        // Kiểm tra số lần nhập sai (tối đa 5 lần)
        if (otpRecord.FailedAttempts >= 5)
        {
            otpRecord.UsedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return ApiResponse<VerifyEmailOtpResponse>.Fail("Bạn đã nhập sai mã quá 5 lần. Mã này đã bị vô hiệu hóa, vui lòng yêu cầu mã mới.");
        }

        // Kiểm tra OTP
        var inputOtpHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Otp.Trim()))).ToLowerInvariant();
        if (inputOtpHash != otpRecord.OtpHash)
        {
            otpRecord.FailedAttempts++;
            var remainingAttempts = 5 - otpRecord.FailedAttempts;

            if (remainingAttempts <= 0)
            {
                otpRecord.UsedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                return ApiResponse<VerifyEmailOtpResponse>.Fail("Bạn đã nhập sai mã quá 5 lần. Mã xác thực đã bị vô hiệu hóa, vui lòng nhấn Gửi lại mã.");
            }

            await _db.SaveChangesAsync(ct);
            return ApiResponse<VerifyEmailOtpResponse>.Fail($"Mã xác thực không chính xác. Bạn còn {remainingAttempts} lần thử.");
        }

        // Xác thực thành công: Vô hiệu hóa OTP ngay lập tức và kích hoạt tài khoản
        otpRecord.UsedAt = DateTime.UtcNow;
        account.Status = AccountStatus.Active;
        account.UpdatedAt = DateTime.UtcNow;
        account.LastLoginAt = DateTime.UtcNow;

        // Tự động cấp phiên đăng nhập và tạo JWT token
        var accessToken = _jwt.GenerateAccessToken(account);
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiry = _jwt.GetRefreshTokenExpiry();

        var refreshTokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
        var session = new LoginSession
        {
            AccountId = account.Id,
            RefreshTokenHash = refreshTokenHash,
            LoggedInAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiry
        };

        _db.LoginSessions.Add(session);

        await _db.SaveChangesAsync(ct);

        var response = new VerifyEmailOtpResponse(
            AccountId: account.Id,
            Username: account.Username,
            FullName: account.FullName,
            Email: account.Email,
            Role: account.Role.ToString(),
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiresAt: _jwt.GetAccessTokenExpiry()
        );

        return ApiResponse<VerifyEmailOtpResponse>.Ok(response);
    }
}
