using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.RefreshToken;

public static class RefreshTokenEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/refresh", async (RefreshTokenRequest req, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(req, ct)))
            .WithTags("Identity")
            .WithSummary("Refresh access token");
        return app;
    }
}
