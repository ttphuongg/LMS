using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public static class ReturnBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/loans/{loanSlipId:long}/return",
            async (long loanSlipId, ReturnBookRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { LoanSlipId = loanSlipId }, ct)))
           .WithTags("Circulation")
           .WithSummary("Process book return for a loan slip (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}