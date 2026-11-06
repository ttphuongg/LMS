using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Library.Modules.Core.Shared;

namespace Library.Modules.Core.Billing.Features.EventHandlers;

public class LoanOverdueEventHandler : INotificationHandler<LoanOverdueEvent>
{
    private readonly AppDbContext _db;
    private readonly IMediator _mediator;

    public LoanOverdueEventHandler(AppDbContext db, IMediator mediator)
    {
        _db = db;
        _mediator = mediator;
    }

    public async Task Handle(LoanOverdueEvent notification, CancellationToken ct)
    {
        var alreadyFined = await _db.Fines.AnyAsync(
            f => f.LoanSlipDetailId == notification.LoanSlipDetailId && f.FineType == FineType.Overdue, ct);
        if (alreadyFined) return;

        var daysLate = (int)(DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - notification.DueDate.DayNumber);
        var fineAmount = daysLate * 5000m; // 5000 VND per day overdue

        await _mediator.Send(new IssueFineRequest(
            notification.AccountId,
            notification.LoanSlipDetailId,
            null,
            FineType.Overdue,
            fineAmount,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))), ct);
    }
}
