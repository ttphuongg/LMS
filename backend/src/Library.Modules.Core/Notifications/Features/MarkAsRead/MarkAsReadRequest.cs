using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.MarkAsRead;

public record MarkAsReadRequest(long NotificationId, int AccountId) : IRequest<ApiResponse<bool>>;
