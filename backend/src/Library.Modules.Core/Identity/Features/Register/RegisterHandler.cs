using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.Register;

public sealed class RegisterHandler : IRequestHandler<RegisterRequest, ApiResponse<int>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<RegisterRequest> _validator;

    public RegisterHandler(AppDbContext db, IValidator<RegisterRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<int>> Handle(RegisterRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<int>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Check duplicates ──────────────────────────────────────────────────
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _db.Accounts.AnyAsync(a => a.Username == normalizedUsername, ct))
            return ApiResponse<int>.Fail("Tên đăng nhập đã tồn tại.");

        if (await _db.Accounts.AnyAsync(a => a.Email == normalizedEmail, ct))
            return ApiResponse<int>.Fail("Email đã được sử dụng.");

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phone = request.PhoneNumber.Trim();
            if (await _db.Accounts.AnyAsync(a => a.PhoneNumber == phone, ct))
                return ApiResponse<int>.Fail("Số điện thoại đã được sử dụng.");
        }

        // ── Create account ────────────────────────────────────────────────────
        var account = new Account
        {
            Username = normalizedUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = request.PhoneNumber?.Trim(),
            Role = AccountRole.Reader,      // Self-registration is always Reader
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(account.Id);
    }
}
