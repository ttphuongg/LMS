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
            async (long fineId, PayFineBody? body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var method = body?.PaymentMethod ?? Data.PaymentMethod.Cash;
                var notes = body?.Notes;
                var librarianId = user.GetAccountId();

                var req = new PayFineRequest(fineId, librarianId, method, notes);
                return Results.Ok(await mediator.Send(req, ct));
            })
           .WithTags("Billing")
           .WithSummary("Thanh toán trực tiếp toàn bộ tiền phạt một lần (StaffOnly)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}
