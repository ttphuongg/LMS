using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.ManageUsers;

public sealed class ManageUsersHandler : 
    IRequestHandler<GetUsersRequest, ApiResponse<GetUsersResult>>,
    IRequestHandler<ChangeRoleRequest, ApiResponse<bool>>,
    IRequestHandler<ChangeStatusRequest, ApiResponse<bool>>
{
    private readonly IdentityDbContext _db;
    private readonly IValidator<ChangeRoleRequest> _roleValidator;
    private readonly IValidator<ChangeStatusRequest> _statusValidator;
    private readonly IMediator _mediator;

    public ManageUsersHandler(
        IdentityDbContext db, 
        IValidator<ChangeRoleRequest> roleValidator, 
        IValidator<ChangeStatusRequest> statusValidator,
        IMediator mediator)
    {
        _db = db;
        _roleValidator = roleValidator;
        _statusValidator = statusValidator;
        _mediator = mediator;
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
            .Select(a => new UserSummary(
                a.Id,
                a.Username,
                a.FullName,
                a.Email,
                a.Role.ToString(),
                a.Status.ToString(),
                a.PhoneNumber,
                a.CreatedAt))
            .ToListAsync(ct);

        items = items.Select(u => u with
        {
            CreatedAt = VietnamTime.SpecifyUtc(u.CreatedAt)
        }).ToList();

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

        if (request.NewStatus == AccountStatus.Locked)
        {
            var reason = !string.IsNullOrWhiteSpace(request.Reason)
                ? request.Reason
                : "Tài khoản bị tạm khóa bởi quản trị viên thư viện.";

            await _mediator.Publish(new AccountLockedEvent(
                account.Id,
                reason,
                DateTime.UtcNow), ct);
        }

        return ApiResponse<bool>.Ok(true);
    }
}
