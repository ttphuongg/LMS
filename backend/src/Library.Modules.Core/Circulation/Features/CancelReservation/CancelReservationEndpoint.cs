using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public static class CancelReservationEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/circulation/reservations/{reservationId:long}", async (long reservationId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var req = new CancelReservationRequest(user.GetAccountId())
            {
                ReservationId = reservationId
            };
            return Results.Ok(await mediator.Send(req, ct));
        })
        .WithTags("Circulation")
        .WithSummary("Cancel a reservation")
        .RequireAuthorization();
        return app;
    }
}