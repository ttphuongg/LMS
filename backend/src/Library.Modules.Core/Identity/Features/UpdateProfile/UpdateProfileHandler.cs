using FluentValidation;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.UpdateProfile;

public sealed class UpdateProfileHandler : IRequestHandler<UpdateProfileRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<UpdateProfileRequest> _validator;

    public UpdateProfileHandler(AppDbContext db, IValidator<UpdateProfileRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateProfileRequest request, CancellationToken ct)
    {
        // ── Validate ──────────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Find account ──────────────────────────────────────────────────────
        var account = await _db.Accounts.FindAsync([request.AccountId], ct);
        if (account is null)
            return ApiResponse<bool>.Fail("Tài khoản không tồn tại.");

        // ── Check phone uniqueness (if changed) ──────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phone = request.PhoneNumber.Trim();
            var phoneInUse = await _db.Accounts
                .AnyAsync(a => a.PhoneNumber == phone && a.Id != request.AccountId, ct);

            if (phoneInUse)
                return ApiResponse<bool>.Fail("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }

        // ── Update fields ─────────────────────────────────────────────────────
        account.FullName = request.FullName.Trim();
        account.PhoneNumber = request.PhoneNumber?.Trim();
        account.Address = request.Address?.Trim();
        account.DateOfBirth = request.DateOfBirth;

        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }
}
