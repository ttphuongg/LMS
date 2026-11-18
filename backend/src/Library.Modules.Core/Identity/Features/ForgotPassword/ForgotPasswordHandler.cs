using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Notifications.Services;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.ForgotPassword;

public sealed class ForgotPasswordHandler : IRequestHandler<ForgotPasswordRequest, ApiResponse<string>>
{
    private const string GenericSuccessMessage =
        "Nếu địa chỉ email tồn tại trên hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu và mã xác thực vào hòm thư của bạn.";

    private readonly IdentityDbContext _db;
    private readonly IValidator<ForgotPasswordRequest> _validator;
    private readonly IEmailService _emailService;

    public ForgotPasswordHandler(
        IdentityDbContext db,
        IValidator<ForgotPasswordRequest> validator,
        IEmailService emailService)
    {
        _db = db;
        _validator = validator;
        _emailService = emailService;
    }

    public async Task<ApiResponse<string>> Handle(ForgotPasswordRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return ApiResponse<string>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Email == normalizedEmail, ct);

        // Bảo vệ chống User Enumeration: Nếu email không tồn tại hoặc bị khóa, vẫn trả về thông báo chung
        if (account is null || account.Status != AccountStatus.Active)
        {
            return ApiResponse<string>.Ok(GenericSuccessMessage);
        }

        // Vô hiệu hóa các mã token/OTP đặt lại mật khẩu còn hiệu lực trước đó của tài khoản này
        var pendingTokens = await _db.PasswordResetTokens
            .Where(t => t.AccountId == account.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);

        foreach (var t in pendingTokens)
        {
            t.UsedAt = DateTime.UtcNow;
        }

        // 1. Sinh Token ngẫu nhiên an toàn (32 bytes = 64 ký tự hex)
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        // 2. Sinh mã OTP 6 chữ số
        var otpCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");

        // 3. Băm Token và OTP bằng SHA256 trước khi lưu vào CSDL
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
        var otpHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(otpCode))).ToLowerInvariant();

        var resetEntity = new PasswordResetToken
        {
            AccountId = account.Id,
            TokenHash = tokenHash,
            OtpHash = otpHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Thời hạn 15 phút
        };

        _db.PasswordResetTokens.Add(resetEntity);
        await _db.SaveChangesAsync(ct);

        // 4. Gửi email chứa liên kết và mã OTP
        await _emailService.SendPasswordResetEmailAsync(account.Email, rawToken, otpCode, ct);

        return ApiResponse<string>.Ok(GenericSuccessMessage);
    }
}
