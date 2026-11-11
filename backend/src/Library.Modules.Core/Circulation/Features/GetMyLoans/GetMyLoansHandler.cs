using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetMyLoans;

public sealed class GetMyLoansHandler : IRequestHandler<GetMyLoansRequest, ApiResponse<List<LoanDto>>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;

    public GetMyLoansHandler(CirculationDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<List<LoanDto>>> Handle(GetMyLoansRequest request, CancellationToken ct)
    {
        var loans = await _db.LoanSlips
            .Include(l => l.Details).ThenInclude(d => d.Renewals)
            .Where(l => l.AccountId == request.AccountId)
            .OrderByDescending(l => l.BorrowedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        var copyIds = loans.SelectMany(l => l.Details).Select(d => d.BookCopyId).Distinct().ToList();
        var copyMap = await _sender.Send(new GetCopyInfosQuery(copyIds), ct);

        var result = loans.Select(l => new LoanDto(
            l.Id,
            VietnamTime.SpecifyUtc(l.BorrowedAt),
            l.Status.ToString(),
            l.Details.Select(d =>
            {
                copyMap.TryGetValue(d.BookCopyId, out var copy);
                var effectiveDueDate = d.GetEffectiveDueDate();
                if (effectiveDueDate == default) effectiveDueDate = l.DueDate;

                return new LoanDetailDto(
                    d.Id, d.BookCopyId, effectiveDueDate, d.ActualReturnDate, d.Status.ToString(), d.Renewals.Count,
                    copy?.BookTitle, copy?.Barcode);
            }).ToList()
        )).ToList();

        return ApiResponse<List<LoanDto>>.Ok(result);
    }
}
