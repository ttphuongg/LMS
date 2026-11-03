using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.ManageUsers;

public sealed class ManageUsersHandler : 
    IRequestHandler<GetUsersRequest, ApiResponse<GetUsersResult>>,
    IRequestHandler<ChangeRoleRequest, ApiResponse<bool>>,
    IRequestHandler<ChangeStatusRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ChangeRoleRequest> _roleValidator;
    private readonly IValidator<ChangeStatusRequest> _statusValidator;

    public ManageUsersHandler(AppDbContext db, IValidator<ChangeRoleRequest> roleValidator, IValidator<ChangeStatusRequest> statusValidator)
    {
        _db = db;
        _roleValidator = roleValidator;
        _statusValidator = statusValidator;
    }

    public async Task<ApiResponse<GetUsersResult>> Handle(GetUsersRequest request, CancellationToken ct)
    {
        IQueryable<Account> query = _db.Accounts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.ToLower().Trim();
            query = query.Where(a => a.Username.ToLower().Contains(kw) || 
                                     a.FullName.ToLower().Contains(kw) || 
                                     a.Email.ToLower().Contains(kw));
        }

        if (request.Role.HasValue && Enum.IsDefined(typeof(AccountRole), request.Role.Value))
        {
            query = query.Where(a => a.Role == (AccountRole)request.Role.Value);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new UserSummary(a.Id, a.Username, a.FullName, a.Email, a.Role.ToString(), a.Status.ToString()))
            .ToListAsync(ct);

        return ApiResponse<GetUsersResult>.Ok(new GetUsersResult(items, total));
    }

    public async Task<ApiResponse<bool>> Handle(ChangeRoleRequest request, CancellationToken ct)
    {
        var val = await _roleValidator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var account = await _db.Accounts.FindAsync(new object[] { request.AccountId }, ct);
        if (account == null) return ApiResponse<bool>.Fail("Tài khoản không tồn tại.");

        account.Role = request.NewRole;
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> Handle(ChangeStatusRequest request, CancellationToken ct)
    {
        var val = await _statusValidator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var account = await _db.Accounts.FindAsync(new object[] { request.AccountId }, ct);
        if (account == null) return ApiResponse<bool>.Fail("Tài khoản không tồn tại.");

        account.Status = request.NewStatus;
        if (request.NewStatus == AccountStatus.Inactive || request.NewStatus == AccountStatus.Locked)
        {
            account.DeactivatedAt = DateTime.UtcNow;
        }
        else
        {
            account.DeactivatedAt = null;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
