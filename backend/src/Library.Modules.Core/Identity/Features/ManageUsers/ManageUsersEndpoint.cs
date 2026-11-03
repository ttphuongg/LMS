using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Identity.Features.ManageUsers;

public record ChangeRoleBody(AccountRole? Role, AccountRole? NewRole);
public record ChangeStatusBody(AccountStatus? Status, AccountStatus? NewStatus);

public static class ManageUsersEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity/users").WithTags("Identity Admin");

        group.MapGet("/", async (IMediator mediator, string? keyword, int? role, int page = 1, int pageSize = 10, CancellationToken ct = default) =>
            Results.Ok(await mediator.Send(new GetUsersRequest(keyword, role, page, pageSize), ct)))
            .WithSummary("Get list of users (Staff & Admin)")
            .RequireAuthorization("StaffOnly");

        group.MapPatch("/{id:int}/role", async (int id, ChangeRoleBody body, IMediator mediator, CancellationToken ct) =>
        {
            var targetRole = body.NewRole ?? body.Role ?? AccountRole.Reader;
            return Results.Ok(await mediator.Send(new ChangeRoleRequest(id, targetRole), ct));
        })
        .WithSummary("Change user role (Admin only)")
        .RequireAuthorization("AdminOnly");

        group.MapPatch("/{id:int}/status", async (int id, ChangeStatusBody body, IMediator mediator, CancellationToken ct) =>
        {
            var targetStatus = body.NewStatus ?? body.Status ?? AccountStatus.Active;
            return Results.Ok(await mediator.Send(new ChangeStatusRequest(id, targetStatus), ct));
        })
        .WithSummary("Change user status (Admin only)")
        .RequireAuthorization("AdminOnly");

        return app;
    }
}