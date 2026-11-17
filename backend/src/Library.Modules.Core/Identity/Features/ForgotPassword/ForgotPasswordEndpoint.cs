using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ForgotPassword;

public record ForgotPasswordBody(string Email);

public static class ForgotPasswordEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/forgot-password",
            async (ForgotPasswordBody body, IMediator mediator, CancellationToken ct) =>
            {
                var req = new ForgotPasswordRequest(body.Email);
                var res = await mediator.Send(req, ct);
                return Results.Ok(res);
            })
            .WithTags("Identity")
            .WithSummary("Request password reset instructions and OTP")
            .AllowAnonymous();

        return app;
    }
}

