using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Notifications.Features.MarkAsRead;

public static class MarkAsReadEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/notifications/{notificationId:long}/read",
            async (long notificationId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(new MarkAsReadRequest(notificationId, user.GetAccountId()), ct)))
           .WithTags("Notifications")
           .WithSummary("Mark a notification as read")
           .RequireAuthorization();

        return app;
    }
}