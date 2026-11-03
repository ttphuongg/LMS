using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public static class ReportIncidentEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/incidents", async (ReportIncidentRequest req, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(req, ct)))
            .WithTags("Circulation")
            .WithSummary("Report a damaged or lost book incident (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}