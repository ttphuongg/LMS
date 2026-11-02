using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.UpdateProfile;

public record UpdateProfileBody(
    string FullName,
    string? PhoneNumber,
    string? Address,
    DateOnly? DateOfBirth
);

public static class UpdateProfileEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/identity/profile",
            async (UpdateProfileBody body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var accountId = user.GetAccountId();
                var req = new UpdateProfileRequest(accountId, body.FullName, body.PhoneNumber, body.Address, body.DateOfBirth);
                return Results.Ok(await mediator.Send(req, ct));
            })
           .WithTags("Identity")
           .WithSummary("Update current user profile")
           .RequireAuthorization();

        return app;
    }
}