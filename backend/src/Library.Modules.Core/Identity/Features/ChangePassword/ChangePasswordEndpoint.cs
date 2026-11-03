using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ChangePassword;

public record ChangePasswordBody(string CurrentPassword, string NewPassword);

public static class ChangePasswordEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/identity/password", async (ChangePasswordBody body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var accountId = user.GetAccountId();
            return Results.Ok(await mediator.Send(new ChangePasswordRequest(accountId, body.CurrentPassword, body.NewPassword), ct));
        })
        .WithTags("Identity")
        .WithSummary("Change password for current user")
        .RequireAuthorization();

        return app;
    }
}