using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public static class GetAllFinesEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/billing/fines", async (int? status, int page, int pageSize, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetAllFinesRequest(status, page, pageSize), ct)))
            .WithTags("Billing Admin")
            .WithSummary("Get all fines (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}