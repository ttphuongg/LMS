using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.SendNotification;

public sealed class SendNotificationHandler : IRequestHandler<SendNotificationRequest, ApiResponse<long>>
{
    private readonly NotificationsDbContext _db;
    public SendNotificationHandler(NotificationsDbContext db) => _db = db;

    public Task<ApiResponse<long>> Handle(SendNotificationRequest request, CancellationToken cancellationToken)
        => throw new NotImplementedException();
}
