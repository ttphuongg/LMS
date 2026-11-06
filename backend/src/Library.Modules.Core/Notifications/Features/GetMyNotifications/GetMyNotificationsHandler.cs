using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Notifications.Features.GetMyNotifications;

public sealed class GetMyNotificationsHandler : IRequestHandler<GetMyNotificationsRequest, ApiResponse<List<NotificationDto>>>
{
    private readonly AppDbContext _db;
    public GetMyNotificationsHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<List<NotificationDto>>> Handle(GetMyNotificationsRequest request, CancellationToken ct)
    {
        var notifs = await _db.Set<Notification>()
            .Where(n => n.AccountId == request.AccountId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(n.Id, n.Title, n.Content, n.NotificationType.ToString(), n.IsRead, n.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<List<NotificationDto>>.Ok(notifs);
    }
}
