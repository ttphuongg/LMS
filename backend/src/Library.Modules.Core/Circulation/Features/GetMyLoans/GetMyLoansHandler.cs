using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetMyLoans;

public sealed class GetMyLoansHandler : IRequestHandler<GetMyLoansRequest, ApiResponse<List<LoanDto>>>
{
    private readonly AppDbContext _db;
    public GetMyLoansHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<List<LoanDto>>> Handle(GetMyLoansRequest request, CancellationToken ct)
    {
        var loans = await _db.Set<LoanSlip>()
            .Include(l => l.Details).ThenInclude(d => d.Renewals)
            .Where(l => l.AccountId == request.AccountId)
            .OrderByDescending(l => l.BorrowedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        // Book titles and barcodes for the copies on these loans
        var copyIds = loans.SelectMany(l => l.Details).Select(d => d.BookCopyId).Distinct().ToList();
        var copies = await _db.BookCopies
            .AsNoTracking()
            .Where(c => copyIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Barcode, c.Book.Title })
            .ToListAsync(ct);
        var copyMap = copies.ToDictionary(c => c.Id);

        var result = loans.Select(l => new LoanDto(
            l.Id,
            l.BorrowedAt,
            l.Status.ToString(),
            l.Details.Select(d =>
            {
                copyMap.TryGetValue(d.BookCopyId, out var copy);
                return new LoanDetailDto(
                    d.Id, d.BookCopyId, l.DueDate, d.ActualReturnDate, d.Status.ToString(), d.Renewals.Count,
                    copy?.Title, copy?.Barcode);
            }).ToList()
        )).ToList();

        return ApiResponse<List<LoanDto>>.Ok(result);
    }
}