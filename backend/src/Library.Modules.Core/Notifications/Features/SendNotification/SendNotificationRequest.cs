using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.SendNotification;

public record SendNotificationRequest(
    int AccountId,
    string Title,
    string Content,
    Notifications.Data.NotificationType NotificationType
) : IRequest<ApiResponse<long>>;
