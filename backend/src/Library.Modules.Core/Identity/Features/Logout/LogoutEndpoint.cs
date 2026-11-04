using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.Logout;

public static class LogoutEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/logout", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var accountId = user.GetAccountId();
            return Results.Ok(await mediator.Send(new LogoutRequest(accountId), ct));
        })
        .WithTags("Identity")
        .WithSummary("Logout user")
        .RequireAuthorization();
        return app;
    }
}
