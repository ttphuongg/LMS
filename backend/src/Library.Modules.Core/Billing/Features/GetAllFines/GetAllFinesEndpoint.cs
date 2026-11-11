using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public static class GetAllFinesEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/billing/fines", async (int? status = null, int page = 1, int pageSize = 10, string? keyword = null, IMediator mediator = null!, CancellationToken ct = default) =>
            Results.Ok(await mediator.Send(new GetAllFinesRequest(status, page, pageSize, keyword), ct)))
            .WithTags("Billing Admin")
            .WithSummary("Get all fines (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}
