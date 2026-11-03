using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetAllRenewals;

public static class GetAllRenewalsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/renewals", async (int? status, IMediator mediator, CancellationToken ct, int page = 1, int pageSize = 10) =>
            Results.Ok(await mediator.Send(new GetAllRenewalsRequest(status, page, pageSize), ct)))
            .WithTags("Circulation Admin")
            .WithSummary("Get all renewal requests (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}
