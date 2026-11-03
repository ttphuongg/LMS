using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.GetMyProfile;

public static class GetMyProfileEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/identity/profile", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetMyProfileRequest(user.GetAccountId()), ct)))
            .WithTags("Identity")
            .WithSummary("Get current user profile")
            .RequireAuthorization();
        return app;
    }
}