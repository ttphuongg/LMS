using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetLoanDetail;

public sealed class GetLoanDetailHandler : IRequestHandler<GetLoanDetailRequest, ApiResponse<LoanSlipDetailResult>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;

    public GetLoanDetailHandler(CirculationDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<LoanSlipDetailResult>> Handle(GetLoanDetailRequest request, CancellationToken ct)
    {
        var slip = await _db.LoanSlips
            .Include(l => l.Details).ThenInclude(d => d.Renewals)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == request.LoanSlipId, ct);

        if (slip == null)
            return ApiResponse<LoanSlipDetailResult>.Fail("Phiếu mượn không tồn tại.");

        var reader = await _sender.Send(new GetAccountSummaryQuery(slip.AccountId), ct);

        var copyIds = slip.Details.Select(d => d.BookCopyId).Distinct().ToList();
        var copyMap = await _sender.Send(new GetCopyInfosQuery(copyIds), ct);

        var items = slip.Details
            .OrderBy(d => d.Id)
            .Select(d =>
            {
                copyMap.TryGetValue(d.BookCopyId, out var copy);
                return new LoanItemDto(
                    d.Id,
                    d.BookCopyId,
                    copy?.Barcode,
                    copy?.BookId,
                    copy?.BookTitle,
                    d.Status.ToString(),
                    d.ActualReturnDate,
                    d.Notes,
                    d.Renewals.Count);
            })
            .ToList();

        var returnedDate = slip.Details
            .Where(d => d.ActualReturnDate.HasValue)
            .Select(d => d.ActualReturnDate)
            .OrderByDescending(d => d)
            .FirstOrDefault();

        var result = new LoanSlipDetailResult(
            slip.Id,
            slip.AccountId,
            reader?.FullName,
            reader?.Username,
            slip.LibrarianId,
            VietnamTime.SpecifyUtc(slip.BorrowedAt),
            slip.DueDate,
            returnedDate,
            slip.Status.ToString(),
            slip.Notes,
            items);

        return ApiResponse<LoanSlipDetailResult>.Ok(result);
    }
}
