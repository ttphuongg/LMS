using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.SendNotification;

public sealed class SendNotificationHandler : IRequestHandler<SendNotificationRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    public SendNotificationHandler(AppDbContext db) => _db = db;

    public Task<ApiResponse<long>> Handle(SendNotificationRequest request, CancellationToken cancellationToken)
        => throw new NotImplementedException();
}
