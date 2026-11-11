using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Notifications.Features.EventHandlers;

public class LoanOverdueNotifHandler : INotificationHandler<LoanOverdueEvent>
{
    private readonly NotificationsDbContext _db;

    public LoanOverdueNotifHandler(NotificationsDbContext db) => _db = db;

    public async Task Handle(LoanOverdueEvent notification, CancellationToken ct)
    {
        // Kiểm tra xem đã gửi thông báo quá hạn cho độc giả này trong vòng 24 giờ qua chưa để tránh spam
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var alreadyNotified = await _db.Notifications.AnyAsync(n =>
            n.AccountId == notification.AccountId &&
            n.NotificationType == NotificationType.Borrow &&
            n.Title == "Sách quá hạn trả" &&
            n.CreatedAt >= cutoff, ct);

        if (alreadyNotified) return;

        var notif = new Notification
        {
            AccountId = notification.AccountId,
            Title = "Sách quá hạn trả",
            Content = $"Bạn đang có sách quá hạn. Hạn trả: {notification.DueDate:dd/MM/yyyy}. Vui lòng trả sách sớm để tránh phát sinh thêm phí phạt.",
            NotificationType = NotificationType.Borrow,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _db.Notifications.Add(notif);
        await _db.SaveChangesAsync(ct);
    }
}
