using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public static class ReturnBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        // Primary resource-oriented endpoint: /api/circulation/loans/{loanSlipId}/return
        app.MapPost("/api/circulation/loans/{loanSlipId:long}/return",
            async (long loanSlipId, ReturnBookRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { LoanSlipId = loanSlipId, LibrarianId = user.GetAccountId() }, ct)))
           .WithTags("Circulation")
           .WithSummary("Process book return for a specific loan slip (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}
