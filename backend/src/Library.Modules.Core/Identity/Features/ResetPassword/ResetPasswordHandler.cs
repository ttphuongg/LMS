using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.ResetPassword;

public sealed class ResetPasswordHandler : IRequestHandler<ResetPasswordRequest, ApiResponse<string>>
{
    private readonly IdentityDbContext _db;
    private readonly IValidator<ResetPasswordRequest> _validator;

    public ResetPasswordHandler(IdentityDbContext db, IValidator<ResetPasswordRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<string>> Handle(ResetPasswordRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return ApiResponse<string>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Email == normalizedEmail, ct);

        if (account is null || account.Status != AccountStatus.Active)
        {
            return ApiResponse<string>.Fail("Mã xác thực không hợp lệ hoặc đã hết thời hạn sử dụng.");
        }

        // Băm mã Token hoặc OTP do client gửi lên
        var inputCode = request.TokenOrOtp.Trim();
        var inputHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(inputCode))).ToLowerInvariant();

        // Tìm bản ghi token còn hiệu lực và chưa được sử dụng
        var resetToken = await _db.PasswordResetTokens
            .Where(t => t.AccountId == account.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .Where(t => t.TokenHash == inputHash || t.OtpHash == inputHash)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (resetToken is null)
        {
            return ApiResponse<string>.Fail("Mã xác thực không hợp lệ hoặc đã hết thời hạn sử dụng (15 phút).");
        }

        // 1. Cập nhật mật khẩu mới (băm với BCrypt)
        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
        account.UpdatedAt = DateTime.UtcNow;

        // 2. Vô hiệu hóa ngay mã token vừa dùng
        resetToken.UsedAt = DateTime.UtcNow;

        // 3. Vô hiệu hóa toàn bộ phiên đăng nhập hiện tại để buộc đăng nhập lại
        var activeSessions = await _db.LoginSessions
            .Where(s => s.AccountId == account.Id && s.LoggedOutAt == null)
            .ToListAsync(ct);

        foreach (var session in activeSessions)
        {
            session.LoggedOutAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return ApiResponse<string>.Ok("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
    }
}
