using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Dashboard.Features.GetDashboardStats;

public static class GetDashboardStatsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard/stats", async (IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetDashboardStatsRequest(), ct)))
            .WithTags("Dashboard")
            .WithSummary("Get library overview statistics (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}

