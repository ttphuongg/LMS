using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.Login;

public static class LoginEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/login",
            async (LoginRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Identity")
           .WithSummary("Authenticate user and receive JWT tokens")
           .AllowAnonymous();

        return app;
    }
}
