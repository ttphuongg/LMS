using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ProcessOverdueLoans;

public sealed class ProcessOverdueLoansHandler : IRequestHandler<ProcessOverdueLoansCommand, int>
{
    private readonly CirculationDbContext _db;
    private readonly IMediator _mediator;

    public ProcessOverdueLoansHandler(CirculationDbContext db, IMediator mediator)
    {
        _db = db;
        _mediator = mediator;
    }

    public async Task<int> Handle(ProcessOverdueLoansCommand request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var overdueDetails = await _db.LoanSlipDetails
            .Include(d => d.LoanSlip)
            .Where(d => d.Status == LoanDetailStatus.Borrowing &&
                        (d.DueDate != null ? d.DueDate < today : d.LoanSlip.DueDate < today) &&
                        d.LoanSlip.Status != LoanStatus.Overdue)
            .ToListAsync(ct);

        foreach (var detail in overdueDetails)
        {
            detail.LoanSlip.Status = LoanStatus.Overdue;
            detail.LoanSlip.UpdatedAt = DateTime.UtcNow;

            await _mediator.Publish(new LoanOverdueEvent(
                detail.Id,
                detail.LoanSlip.AccountId,
                detail.BookCopyId,
                detail.DueDate ?? detail.LoanSlip.DueDate), ct);
        }

        if (overdueDetails.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return overdueDetails.Count;
    }
}

