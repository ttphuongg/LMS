using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetAllLoans;

public sealed class GetAllLoansHandler : IRequestHandler<GetAllLoansRequest, ApiResponse<GetAllLoansResult>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;

    public GetAllLoansHandler(CirculationDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<GetAllLoansResult>> Handle(GetAllLoansRequest request, CancellationToken ct)
    {
        IQueryable<LoanSlip> query = _db.LoanSlips.Include(l => l.Details).AsNoTracking();

        if (request.OpenOnly)
            query = query.Where(l => l.Status != LoanStatus.Returned && l.Status != LoanStatus.Cancelled);

        if (request.Status.HasValue && Enum.IsDefined(typeof(LoanStatus), request.Status.Value))
            query = query.Where(l => l.Status == (LoanStatus)request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim();
            var normalizedSlip = kw.StartsWith("LS-", StringComparison.OrdinalIgnoreCase) ? kw[3..].Trim() : kw;
            var hasSlipId = long.TryParse(normalizedSlip, out var slipId);

            // Gọi tuần tự để dùng chung scoped SqlConnection an toàn (MARS tắt)
            var matchingAccountIds = await _sender.Send(new SearchAccountIdsQuery(kw), ct);
            var matchingCopyIds = await _sender.Send(new SearchCopyIdsByBarcodeQuery(kw), ct);

            query = query.Where(l =>
                (hasSlipId && l.Id == slipId) ||
                matchingAccountIds.Contains(l.AccountId) ||
                l.Details.Any(d => matchingCopyIds.Contains(d.BookCopyId)));
        }

        var page = Math.Max(request.Page, 1);
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 100);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(l => l.BorrowedAt)
            .ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LoanSummaryDto(
                l.Id,
                l.AccountId,
                l.LibrarianId,
                l.BorrowedAt,
                l.Status.ToString(),
                l.Details.Count,
                null,
                l.DueDate))
            .ToListAsync(ct);

        // Attach reader names and enforce Utc kind on BorrowedAt for this page
        if (items.Count > 0)
        {
            var accountIds = items.Select(i => i.AccountId).Distinct().ToList();
            var names = await _sender.Send(new GetAccountNamesQuery(accountIds), ct);
            items = items.Select(i => i with
            {
                BorrowedAt = VietnamTime.SpecifyUtc(i.BorrowedAt),
                ReaderName = names.GetValueOrDefault(i.AccountId)
            }).ToList();
        }

        return ApiResponse<GetAllLoansResult>.Ok(new GetAllLoansResult(items, total));
    }
}
