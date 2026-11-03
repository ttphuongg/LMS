using FluentValidation;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.ChangePassword;

public sealed class ChangePasswordHandler : IRequestHandler<ChangePasswordRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ChangePasswordRequest> _validator;

    public ChangePasswordHandler(AppDbContext db, IValidator<ChangePasswordRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(ChangePasswordRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var account = await _db.Accounts.FindAsync(new object[] { request.AccountId }, ct);
        if (account == null) return ApiResponse<bool>.Fail("Tài kho?n không t?n t?i.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, account.PasswordHash))
            return ApiResponse<bool>.Fail("M?t kh?u hi?n t?i không ðúng.");

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
