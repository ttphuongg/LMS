using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetAllRenewals;

public sealed class GetAllRenewalsHandler : IRequestHandler<GetAllRenewalsRequest, ApiResponse<GetAllRenewalsResult>>
{
    private readonly AppDbContext _db;
    private readonly ISender _sender;

    public GetAllRenewalsHandler(AppDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<GetAllRenewalsResult>> Handle(GetAllRenewalsRequest request, CancellationToken ct)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 100);

        IQueryable<Renewal> query = _db.Renewals.AsNoTracking();

        if (request.Status.HasValue && Enum.IsDefined(typeof(RenewalStatus), request.Status.Value))
            query = query.Where(r => r.Status == (RenewalStatus)request.Status.Value);

        var total = await query.CountAsync(ct);

        var rows = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.LoanSlipDetailId,
                LoanSlipId = r.LoanSlipDetail.LoanSlipId,
                AccountId = r.LoanSlipDetail.LoanSlip.AccountId,
                BookCopyId = r.LoanSlipDetail.BookCopyId,
                r.RenewalNumber,
                r.RequestedAt,
                r.OldDueDate,
                r.NewDueDate,
                r.Status,
                r.Reason,
                r.LibrarianId
            })
            .ToListAsync(ct);

        // Look up reader names and book info for just this page
        var accountIds = rows.Select(x => x.AccountId).Distinct().ToList();
        var names = await _sender.Send(new GetAccountNamesQuery(accountIds), ct);

        var copyIds = rows.Select(x => x.BookCopyId).Distinct().ToList();
        var copyMap = await _sender.Send(new GetCopyInfosQuery(copyIds), ct);

        var items = rows.Select(x =>
        {
            names.TryGetValue(x.AccountId, out var readerName);
            copyMap.TryGetValue(x.BookCopyId, out var copy);
            return new RenewalItemDto(
                x.Id,
                x.LoanSlipDetailId,
                x.LoanSlipId,
                x.AccountId,
                readerName,
                x.BookCopyId,
                copy?.Barcode,
                copy?.BookTitle,
                x.RenewalNumber,
                x.RequestedAt,
                x.OldDueDate,
                x.NewDueDate,
                x.Status.ToString(),
                x.Reason,
                x.LibrarianId);
        }).ToList();

        return ApiResponse<GetAllRenewalsResult>.Ok(new GetAllRenewalsResult(items, total));
    }
}
