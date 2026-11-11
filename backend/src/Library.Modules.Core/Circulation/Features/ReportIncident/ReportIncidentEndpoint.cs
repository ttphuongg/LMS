using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public static class ReportIncidentEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/incidents", async (ReportIncidentRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var finalReq = req with { LibrarianId = user.GetAccountId() };
            return Results.Ok(await mediator.Send(finalReq, ct));
        })
            .WithTags("Circulation")
            .WithSummary("Report a damaged or lost book incident (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}
