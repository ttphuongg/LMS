using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetMyLoans;

public static class GetMyLoansEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/my-loans", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetMyLoansRequest(user.GetAccountId()), ct)))
            .WithTags("Circulation")
            .WithSummary("Get user's loan history")
            .RequireAuthorization();
        return app;
    }
}