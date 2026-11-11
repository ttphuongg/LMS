using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.EventHandlers;

public class FineIssuedEventHandler : INotificationHandler<FineIssuedEvent>
{
    private readonly NotificationsDbContext _db;

    public FineIssuedEventHandler(NotificationsDbContext db)
    {
        _db = db;
    }

    public async Task Handle(FineIssuedEvent notification, CancellationToken ct)
    {
        var notif = new Notification
        {
            AccountId = notification.AccountId,
            Title = "Bạn có phiếu phạt mới",
            Content = $"Bạn vừa có phiếu phạt {notification.Amount:N0} VNĐ với lý do: {notification.FineType}. Vui lòng thanh toán sớm.",
            NotificationType = NotificationType.Fine,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _db.Set<Notification>().Add(notif);
        await _db.SaveChangesAsync(ct);
    }
}
