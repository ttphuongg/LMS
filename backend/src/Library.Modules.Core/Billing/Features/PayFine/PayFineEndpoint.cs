using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Billing.Features.PayFine;

public static class PayFineEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/billing/fines/{fineId:long}/payments",
            async (long fineId, PayFineRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var finalReq = user.IsStaff() && !req.LibrarianId.HasValue
                    ? req with { FineId = fineId, LibrarianId = user.GetAccountId() }
                    : req with { FineId = fineId };
                return Results.Ok(await mediator.Send(finalReq, ct));
            })
           .WithTags("Billing")
           .WithSummary("Record a payment towards a fine")
           .RequireAuthorization();

        return app;
    }
}