using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.VerifyEmailOtp;

public static class VerifyEmailOtpEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/verify-email-otp",
            async (VerifyEmailOtpRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Identity")
           .WithSummary("Verify registration email with 6-digit OTP code")
           .AllowAnonymous();

        return app;
    }
}
