using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Billing.Features.IssueFine;

public static class IssueFineEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/billing/fines",
            async (IssueFineRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Billing")
           .WithSummary("Issue a fine to an account (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}