using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.EventHandlers;

public class LoanOverdueEventHandler : INotificationHandler<LoanOverdueEvent>
{
    private readonly BillingDbContext _db;
    private readonly ISender _sender;

    public LoanOverdueEventHandler(BillingDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task Handle(LoanOverdueEvent notification, CancellationToken ct)
    {
        var alreadyFined = await _db.Fines.AnyAsync(
            f => f.LoanSlipDetailId == notification.LoanSlipDetailId && f.FineType == FineType.Overdue, ct);
        if (alreadyFined) return;

        var daysLate = (int)(DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - notification.DueDate.DayNumber);
        var fineAmount = daysLate * 5000m; // 5000 VND per day overdue

        await _sender.Send(new IssueFineRequest(
            notification.AccountId,
            notification.LoanSlipDetailId,
            null,
            FineType.Overdue,
            fineAmount,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))), ct);
    }
}
