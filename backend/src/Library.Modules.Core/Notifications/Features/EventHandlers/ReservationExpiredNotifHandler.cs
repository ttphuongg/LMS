using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.EventHandlers;

public class ReservationExpiredNotifHandler : INotificationHandler<ReservationExpiredEvent>
{
    private readonly NotificationsDbContext _db;

    public ReservationExpiredNotifHandler(NotificationsDbContext db) => _db = db;

    public async Task Handle(ReservationExpiredEvent notification, CancellationToken ct)
    {
        _db.Set<Notification>().Add(new Notification
        {
            AccountId = notification.AccountId,
            Title = "Đặt trước đã hết hạn",
            Content = "Yêu cầu đặt trước của bạn đã hết hạn do chưa đến nhận sách đúng hạn. Bạn có thể đặt trước lại nếu vẫn cần.",
            NotificationType = NotificationType.Reserve,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        });
        await _db.SaveChangesAsync(ct);
    }
}