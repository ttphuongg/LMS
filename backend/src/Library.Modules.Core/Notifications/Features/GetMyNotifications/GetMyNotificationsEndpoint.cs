using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Notifications.Features.GetMyNotifications;

public static class GetMyNotificationsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/notifications/my-notifications", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetMyNotificationsRequest(user.GetAccountId()), ct)))
            .WithTags("Notifications")
            .WithSummary("Get user's notifications")
            .RequireAuthorization();
        return app;
    }
}