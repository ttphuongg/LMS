using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared;
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
        var today = VietnamTime.Today();
        var daysLate = (int)(today.DayNumber - notification.DueDate.DayNumber);
        if (daysLate <= 0) return;

        var fineAmount = daysLate * 5000m; // 5.000 VND / ngày quá hạn

        var existingFine = await _db.Fines.FirstOrDefaultAsync(
            f => f.LoanSlipDetailId == notification.LoanSlipDetailId && f.FineType == FineType.Overdue, ct);

        if (existingFine != null)
        {
            // Tăng số tiền phạt theo ngày nếu phiếu vẫn chưa thanh toán
            if (existingFine.Status == FineStatus.Unpaid && existingFine.Amount < fineAmount)
            {
                existingFine.Amount = fineAmount;
                await _db.SaveChangesAsync(ct);
            }
            return;
        }

        await _sender.Send(new IssueFineRequest(
            notification.AccountId,
            notification.LoanSlipDetailId,
            null,
            FineType.Overdue,
            fineAmount,
            today.AddDays(7)), ct);
    }
}
