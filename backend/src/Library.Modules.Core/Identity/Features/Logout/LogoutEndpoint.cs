using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.Logout;

public static class LogoutEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/logout", async (LogoutRequest req, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(req, ct)))
            .WithTags("Identity")
            .WithSummary("Logout user")
            .RequireAuthorization();
        return app;
    }
}
