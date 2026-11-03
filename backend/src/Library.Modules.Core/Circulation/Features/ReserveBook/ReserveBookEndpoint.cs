using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.ReserveBook;

public static class ReserveBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/reservations",
            async (ReserveBookRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var finalReq = user.IsStaff() && req.AccountId > 0 
                    ? req 
                    : req with { AccountId = user.GetAccountId() };
                return Results.Ok(await mediator.Send(finalReq, ct));
            })
           .WithTags("Circulation")
           .WithSummary("Reserve a book for a reader")
           .RequireAuthorization();

        return app;
    }
}