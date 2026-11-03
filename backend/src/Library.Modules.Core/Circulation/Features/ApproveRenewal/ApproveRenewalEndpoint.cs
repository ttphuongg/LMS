using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public static class ApproveRenewalEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/circulation/renewals/{renewalId:long}/status", async (long renewalId, ApproveRenewalRequest req, IMediator mediator, CancellationToken ct) =>
        {
            req.RenewalId = renewalId;
            return Results.Ok(await mediator.Send(req, ct));
        })
        .WithTags("Circulation")
        .WithSummary("Approve or reject a renewal request (Staff only)")
        .RequireAuthorization("StaffOnly");
        return app;
    }
}