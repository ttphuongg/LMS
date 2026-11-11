using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.SendNotification;

public sealed class SendNotificationHandler : IRequestHandler<SendNotificationRequest, ApiResponse<long>>
{
    private readonly NotificationsDbContext _db;
    public SendNotificationHandler(NotificationsDbContext db) => _db = db;

    public async Task<ApiResponse<long>> Handle(SendNotificationRequest request, CancellationToken ct)
    {
        var notif = new Notification
        {
            AccountId = request.AccountId,
            Title = request.Title,
            Content = request.Content,
            NotificationType = request.NotificationType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notif);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<long>.Ok(notif.Id);
    }
}
