using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ChangePassword;

public record ChangePasswordBody(string CurrentPassword, string NewPassword);
public record ChangePasswordDto(int AccountId, string CurrentPassword, string NewPassword);

public static class ChangePasswordEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        // POST endpoint: AccountId luôn lấy từ token (loại bỏ lỗ hổng nhận từ body)
        app.MapPost("/api/identity/change-password", async (ChangePasswordBody body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var accountId = user.GetAccountId();
            return Results.Ok(await mediator.Send(new ChangePasswordRequest(accountId, body.CurrentPassword, body.NewPassword), ct));
        })
        .WithTags("Identity")
        .WithSummary("Change password via POST (AccountId taken from token)")
        .RequireAuthorization();

        return app;
    }
}
