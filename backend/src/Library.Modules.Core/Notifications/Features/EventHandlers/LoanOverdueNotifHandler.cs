using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.EventHandlers;

public class LoanOverdueNotifHandler : INotificationHandler<LoanOverdueEvent>
{
    private readonly NotificationsDbContext _db;

    public LoanOverdueNotifHandler(NotificationsDbContext db) => _db = db;

    public async Task Handle(LoanOverdueEvent notification, CancellationToken ct)
    {
        var notif = new Notification
        {
            AccountId = notification.AccountId,
            Title = "Sach qua han tra",
            Content = $"Ban dang co sach qua han. Han tra: {notification.DueDate:dd/MM/yyyy}. Vui long tra sach som de tranh phat sinh them phi phat.",
            NotificationType = NotificationType.Borrow,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _db.Set<Notification>().Add(notif);
        await _db.SaveChangesAsync(ct);
    }
}