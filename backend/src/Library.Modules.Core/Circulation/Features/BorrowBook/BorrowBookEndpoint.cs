using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.BorrowBook;

public static class BorrowBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/circulation/loans",
            async (BorrowBookRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var staffId = user.GetAccountId();
                var finalReq = req.LibrarianId.HasValue ? req : req with { LibrarianId = staffId };
                return Results.Ok(await mediator.Send(finalReq, ct));
            })
           .WithTags("Circulation")
           .WithSummary("Create a new loan slip (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}