using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetAllLoans;

public static class GetAllLoansEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/loans", async (int? status, IMediator mediator, CancellationToken ct, int page = 1, int pageSize = 10) =>
            Results.Ok(await mediator.Send(new GetAllLoansRequest(status, page, pageSize), ct)))
            .WithTags("Circulation Admin")
            .WithSummary("Get all loans (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}