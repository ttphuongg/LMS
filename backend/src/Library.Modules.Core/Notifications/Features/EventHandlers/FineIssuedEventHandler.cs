using Library.Modules.Core.Notifications.Data;
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
            Title = "Ban co phieu phat moi",
            Content = $"Ban vua bi phat {notification.Amount:N0} VND voi ly do: {notification.FineType}. Vui long thanh toan som.",
            NotificationType = NotificationType.Fine,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _db.Set<Notification>().Add(notif);
        await _db.SaveChangesAsync(ct);
    }
}