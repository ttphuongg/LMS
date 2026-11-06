using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Billing.Features.GetMyFines;

public static class GetMyFinesEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/billing/my-fines", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetMyFinesRequest(user.GetAccountId()), ct)))
            .WithTags("Billing")
            .WithSummary("Get user's fines")
            .RequireAuthorization();
        return app;
    }
}