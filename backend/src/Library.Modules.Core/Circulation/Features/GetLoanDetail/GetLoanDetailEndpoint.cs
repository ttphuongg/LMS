using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetLoanDetail;

public static class GetLoanDetailEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/loans/{loanSlipId:long}", async (long loanSlipId, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetLoanDetailRequest(loanSlipId), ct)))
            .WithTags("Circulation Admin")
            .WithSummary("Get one loan slip with its books (Staff only)")
            .RequireAuthorization("StaffOnly");
        return app;
    }
}
