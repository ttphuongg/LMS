using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetMyReservations;

public static class GetMyReservationsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/my-reservations", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetMyReservationsRequest(user.GetAccountId()), ct)))
            .WithTags("Circulation")
            .WithSummary("Get my reservations")
            .RequireAuthorization();
        return app;
    }
}
