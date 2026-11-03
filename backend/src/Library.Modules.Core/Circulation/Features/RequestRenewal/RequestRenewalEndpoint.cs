using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.RequestRenewal;

public static class RequestRenewalEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/loan-details/{detailId:long}/renewals",
            async (long detailId, RequestRenewalRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var finalReq = req with { LoanSlipDetailId = detailId, AccountId = user.GetAccountId() };
                return Results.Ok(await mediator.Send(finalReq, ct));
            })
           .WithTags("Circulation")
           .WithSummary("Request a renewal for a borrowed copy")
           .RequireAuthorization();

        return app;
    }
}