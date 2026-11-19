using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Notifications.Services;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.Register;

public sealed class RegisterHandler : IRequestHandler<RegisterRequest, ApiResponse<RegisterResponse>>
{
    private readonly IdentityDbContext _db;
    private readonly IValidator<RegisterRequest> _validator;
    private readonly IEmailService _emailService;

    public RegisterHandler(
        IdentityDbContext db,
        IValidator<RegisterRequest> validator,
        IEmailService emailService)
    {
        _db = db;
        _validator = validator;
        _emailService = emailService;
    }

    public async Task<ApiResponse<RegisterResponse>> Handle(RegisterRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<RegisterResponse>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // ── Check duplicates with Active accounts ─────────────────────────────
        if (await _db.Accounts.AnyAsync(a => a.Username == normalizedUsername && a.Status == AccountStatus.Active, ct))
            return ApiResponse<RegisterResponse>.Fail("Tên đăng nhập đã tồn tại.");

        if (await _db.Accounts.AnyAsync(a => a.Email == normalizedEmail && a.Status == AccountStatus.Active, ct))
            return ApiResponse<RegisterResponse>.Fail("Email đã được sử dụng.");

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phone = request.PhoneNumber.Trim();
            if (await _db.Accounts.AnyAsync(a => a.PhoneNumber == phone && a.Status == AccountStatus.Active, ct))
                return ApiResponse<RegisterResponse>.Fail("Số điện thoại đã được sử dụng.");
        }

        // ── Create or reuse inactive account ──────────────────────────────────
        var existingInactiveAccount = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Email == normalizedEmail && a.Status == AccountStatus.Inactive, ct);

        Account account;
        if (existingInactiveAccount != null)
        {
            // Kiểm tra giới hạn tần suất gửi lại OTP (60 giây)
            var lastOtp = await _db.EmailVerificationOtps
                .Where(o => o.AccountId == existingInactiveAccount.Id)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (lastOtp != null && DateTime.UtcNow < lastOtp.CreatedAt.AddSeconds(60))
            {
                var waitSeconds = (int)Math.Ceiling((lastOtp.CreatedAt.AddSeconds(60) - DateTime.UtcNow).TotalSeconds);
                return ApiResponse<RegisterResponse>.Fail($"Vui lòng đợi {waitSeconds} giây trước khi gửi lại yêu cầu đăng ký.");
            }

            if (await _db.Accounts.AnyAsync(a => a.Username == normalizedUsername && a.Id != existingInactiveAccount.Id && a.Status == AccountStatus.Active, ct))
                return ApiResponse<RegisterResponse>.Fail("Tên đăng nhập đã tồn tại.");

            existingInactiveAccount.Username = normalizedUsername;
            existingInactiveAccount.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            existingInactiveAccount.FullName = request.FullName.Trim();
            existingInactiveAccount.PhoneNumber = request.PhoneNumber?.Trim();
            existingInactiveAccount.UpdatedAt = DateTime.UtcNow;
            account = existingInactiveAccount;
        }
        else
        {
            // Kiểm tra nếu tên đăng nhập thuộc tài khoản Inactive khác
            var existingInactiveUsername = await _db.Accounts
                .FirstOrDefaultAsync(a => a.Username == normalizedUsername && a.Status == AccountStatus.Inactive, ct);
            if (existingInactiveUsername != null)
                return ApiResponse<RegisterResponse>.Fail("Tên đăng nhập đã tồn tại.");

            account = new Account
            {
                Username = normalizedUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                PhoneNumber = request.PhoneNumber?.Trim(),
                Role = AccountRole.Reader,
                Status = AccountStatus.Inactive, // Chưa xác thực email
                CreatedAt = DateTime.UtcNow
            };

            _db.Accounts.Add(account);
            await _db.SaveChangesAsync(ct);
        }

        // ── Vô hiệu hóa các mã OTP cũ chưa sử dụng của tài khoản ──────────────
        var pendingOtps = await _db.EmailVerificationOtps
            .Where(o => o.AccountId == account.Id && o.UsedAt == null)
            .ToListAsync(ct);

        foreach (var oldOtp in pendingOtps)
        {
            oldOtp.UsedAt = DateTime.UtcNow;
        }

        // ── Sinh mã OTP ngẫu nhiên 6 chữ số an toàn và băm SHA-256 ───────────
        var otpCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var otpHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(otpCode))).ToLowerInvariant();

        var otpEntity = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = otpHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(3), // Hiệu lực 3 phút
            FailedAttempts = 0
        };

        _db.EmailVerificationOtps.Add(otpEntity);
        await _db.SaveChangesAsync(ct);

        // ── Gửi email chứa mã OTP xác thực (Không log mã OTP ra logger) ───────
        await _emailService.SendRegistrationOtpEmailAsync(account.Email, otpCode, account.FullName, ct);

        return ApiResponse<RegisterResponse>.Ok(new RegisterResponse(
            AccountId: account.Id,
            Email: account.Email,
            Message: "Mã xác thực gồm 6 chữ số đã được gửi đến email của bạn."
        ));
    }
}
