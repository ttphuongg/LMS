using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetAllLoans;

public sealed class GetAllLoansHandler : IRequestHandler<GetAllLoansRequest, ApiResponse<GetAllLoansResult>>
{
    private readonly AppDbContext _db;
    public GetAllLoansHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<GetAllLoansResult>> Handle(GetAllLoansRequest request, CancellationToken ct)
    {
        IQueryable<LoanSlip> query = _db.LoanSlips.Include(l => l.Details).AsNoTracking();

        if (request.Status.HasValue && Enum.IsDefined(typeof(LoanStatus), request.Status.Value))
            query = query.Where(l => l.Status == (LoanStatus)request.Status.Value);

        var page = Math.Max(request.Page, 1);
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 100);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(l => l.BorrowedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LoanSummaryDto(l.Id, l.AccountId, l.LibrarianId, l.BorrowedAt, l.Status.ToString(), l.Details.Count, null))
            .ToListAsync(ct);

        // Attach reader names for this page
        var accountIds = items.Select(i => i.AccountId).Distinct().ToList();
        var names = await _db.Accounts
            .AsNoTracking()
            .Where(a => accountIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => a.FullName, ct);
        items = items.Select(i => i with { ReaderName = names.GetValueOrDefault(i.AccountId) }).ToList();

        return ApiResponse<GetAllLoansResult>.Ok(new GetAllLoansResult(items, total));
    }
}
