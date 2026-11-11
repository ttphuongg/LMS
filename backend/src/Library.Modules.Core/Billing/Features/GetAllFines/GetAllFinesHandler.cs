using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public sealed class GetAllFinesHandler : IRequestHandler<GetAllFinesRequest, ApiResponse<GetAllFinesResult>>
{
    private readonly BillingDbContext _db;
    private readonly ISender _sender;

    public GetAllFinesHandler(BillingDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<GetAllFinesResult>> Handle(GetAllFinesRequest request, CancellationToken ct)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize > 100 ? 100 : request.PageSize;

        IQueryable<Fine> query = _db.Fines.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim();

            long? fineIdMatch = null;
            if (long.TryParse(kw, out var directFineId) && directFineId > 0)
            {
                fineIdMatch = directFineId;
            }
            else if (kw.StartsWith("FP-", StringComparison.OrdinalIgnoreCase) &&
                     long.TryParse(kw.AsSpan(3), out var prefixedFineId) && prefixedFineId > 0)
            {
                fineIdMatch = prefixedFineId;
            }

            int? accountIdMatch = int.TryParse(kw, out var directAccId) && directAccId > 0 ? directAccId : null;
            var matchingAccountIds = await _sender.Send(new SearchAccountIdsQuery(kw), ct);

            var hasFineId = fineIdMatch.HasValue;
            var targetFineId = fineIdMatch.GetValueOrDefault();
            var hasAccountId = accountIdMatch.HasValue;
            var targetAccountId = accountIdMatch.GetValueOrDefault();
            var hasMatchedAccounts = matchingAccountIds.Count > 0;

            if (hasFineId || hasAccountId || hasMatchedAccounts)
            {
                query = query.Where(f =>
                    (hasFineId && f.Id == targetFineId) ||
                    (hasAccountId && f.AccountId == targetAccountId) ||
                    (hasMatchedAccounts && matchingAccountIds.Contains(f.AccountId)));
            }
            else
            {
                query = query.Where(_ => false);
            }
        }

        if (request.Status.HasValue && Enum.IsDefined(typeof(FineStatus), request.Status.Value))
            query = query.Where(f => f.Status == (FineStatus)request.Status.Value);

        // Thống kê theo mô hình thanh toán trọn gói 1 lần (Unpaid / Paid / Cancelled)
        var summaryAgg = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalCount = g.Count(),
                TotalFineAmount = g.Where(f => f.Status != FineStatus.Cancelled)
                    .Sum(f => (decimal?)f.Amount) ?? 0m,
                TotalPaidAmount = g.Where(f => f.Status == FineStatus.Paid)
                    .Sum(f => (decimal?)f.Amount) ?? 0m,
                TotalRemainingAmount = g.Where(f => f.Status == FineStatus.Unpaid)
                    .Sum(f => (decimal?)f.Amount) ?? 0m,
            })
            .FirstOrDefaultAsync(ct);

        var total = summaryAgg?.TotalCount ?? 0;
        if (total == 0)
        {
            return ApiResponse<GetAllFinesResult>.Ok(
                new GetAllFinesResult([], 0, new FineSummary(0m, 0m, 0m)));
        }

        var summary = new FineSummary(
            summaryAgg!.TotalFineAmount,
            summaryAgg.TotalPaidAmount,
            summaryAgg.TotalRemainingAmount);

        var items = await query
            .OrderByDescending(f => f.IssuedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FineSummaryDto(
                f.Id,
                f.AccountId,
                f.FineType.ToString(),
                f.Amount,
                f.Status.ToString(),
                f.IssuedAt,
                null))
            .ToListAsync(ct);

        if (items.Count > 0)
        {
            var accountIds = items.Select(i => i.AccountId).Distinct().ToList();
            var names = await _sender.Send(new GetAccountNamesQuery(accountIds), ct);
            items = items.Select(i => i with { ReaderName = names.GetValueOrDefault(i.AccountId) }).ToList();
        }

        return ApiResponse<GetAllFinesResult>.Ok(new GetAllFinesResult(items, total, summary));
    }
}
