using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.EventHandlers;

public class ReservationReadyNotifHandler : INotificationHandler<ReservationReadyEvent>
{
    private readonly NotificationsDbContext _db;

    public ReservationReadyNotifHandler(NotificationsDbContext db) => _db = db;

    public async Task Handle(ReservationReadyEvent notification, CancellationToken ct)
    {
        // ExpiresAt lưu UTC; Việt Nam UTC+7, không có giờ mùa hè
        var deadline = notification.ExpiresAt.HasValue
            ? $" trước {notification.ExpiresAt.Value.AddHours(7):HH:mm dd/MM/yyyy}"
            : "";

        _db.Set<Notification>().Add(new Notification
        {
            AccountId = notification.AccountId,
            Title = "Sách đặt trước đã sẵn sàng",
            Content = $"Sách bạn đặt trước đã có. Vui lòng đến thư viện nhận sách{deadline}, quá hạn yêu cầu sẽ bị hủy.",
            NotificationType = NotificationType.Reserve,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        });
        await _db.SaveChangesAsync(ct);
    }
}