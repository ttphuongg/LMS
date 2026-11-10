using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Notifications.Features.GetMyNotifications;

public record GetMyNotificationsRequest(int AccountId) : IRequest<ApiResponse<List<NotificationDto>>>;
public record NotificationDto(long Id, string Title, string Content, string Type, bool IsRead, DateTime CreatedAt);
