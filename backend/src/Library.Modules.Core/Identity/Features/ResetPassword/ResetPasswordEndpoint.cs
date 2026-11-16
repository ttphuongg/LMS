using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ResetPassword;

public record ResetPasswordBody(string Email, string TokenOrOtp, string NewPassword);

public static class ResetPasswordEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/reset-password",
            async (ResetPasswordBody body, IMediator mediator, CancellationToken ct) =>
            {
                var req = new ResetPasswordRequest(body.Email, body.TokenOrOtp, body.NewPassword);
                var res = await mediator.Send(req, ct);
                return Results.Ok(res);
            })
            .WithTags("Identity")
            .WithSummary("Reset password using valid token or OTP")
            .AllowAnonymous();

        return app;
    }
}

