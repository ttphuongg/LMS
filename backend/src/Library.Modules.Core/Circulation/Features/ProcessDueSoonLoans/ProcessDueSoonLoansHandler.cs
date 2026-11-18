using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ProcessDueSoonLoans;

/// <summary>
/// Quét các khoản mượn sách sắp đến hạn trả trong vòng 1 - 5 ngày tới và phát sự kiện LoanDueSoonEvent.
/// </summary>
public sealed class ProcessDueSoonLoansHandler : IRequestHandler<ProcessDueSoonLoansCommand, int>
{
    private readonly CirculationDbContext _db;
    private readonly IMediator _mediator;

    public ProcessDueSoonLoansHandler(CirculationDbContext db, IMediator mediator)
    {
        _db = db;
        _mediator = mediator;
    }

    public async Task<int> Handle(ProcessDueSoonLoansCommand request, CancellationToken ct)
    {
        // Múi giờ Việt Nam (UTC+7)
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var minDueDate = today.AddDays(1);
        var maxDueDate = today.AddDays(5);

        var dueSoonDetails = await _db.LoanSlipDetails
            .Include(d => d.LoanSlip)
            .Where(d => d.Status == LoanDetailStatus.Borrowing &&
                        d.LoanSlip.Status == LoanStatus.Borrowing &&
                        ((d.DueDate != null && d.DueDate >= minDueDate && d.DueDate <= maxDueDate) ||
                         (d.DueDate == null && d.LoanSlip.DueDate >= minDueDate && d.LoanSlip.DueDate <= maxDueDate)))
            .ToListAsync(ct);

        foreach (var detail in dueSoonDetails)
        {
            var dueDate = detail.DueDate ?? detail.LoanSlip.DueDate;
            var daysUntilDue = dueDate.DayNumber - today.DayNumber;

            await _mediator.Publish(new LoanDueSoonEvent(
                detail.Id,
                detail.LoanSlip.AccountId,
                detail.BookCopyId,
                dueDate,
                daysUntilDue), ct);
        }

        return dueSoonDetails.Count;
    }
}

