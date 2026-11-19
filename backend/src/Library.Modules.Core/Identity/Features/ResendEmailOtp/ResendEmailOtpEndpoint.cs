using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ResendEmailOtp;

public static class ResendEmailOtpEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/resend-email-otp",
            async (ResendEmailOtpRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Identity")
           .WithSummary("Resend registration email verification OTP")
           .AllowAnonymous();

        return app;
    }
}
