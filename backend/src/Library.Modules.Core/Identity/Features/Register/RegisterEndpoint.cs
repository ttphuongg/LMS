using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.Register;

public static class RegisterEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/register",
            async (RegisterRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Identity")
           .WithSummary("Register a new reader account")
           .AllowAnonymous();

        return app;
    }
}
