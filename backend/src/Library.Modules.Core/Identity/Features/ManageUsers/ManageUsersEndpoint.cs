using System.Security.Claims;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
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

        group.MapPatch("/{id:int}/role", async (int id, ChangeRoleBody body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var newRole = body?.NewRole ?? body?.Role;
            if (!newRole.HasValue)
                return Results.BadRequest(ApiResponse<bool>.Fail("Vui lòng cung cấp vai trò mới (Role hoặc NewRole)."));

            var currentAdminId = user.GetAccountId();
            return Results.Ok(await mediator.Send(new ChangeRoleRequest(id, newRole.Value, currentAdminId), ct));
        })
        .WithSummary("Change user role (Admin only)")
        .RequireAuthorization("AdminOnly");

        group.MapPatch("/{id:int}/status", async (int id, ChangeStatusBody body, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var newStatus = body?.NewStatus ?? body?.Status;
            if (!newStatus.HasValue)
                return Results.BadRequest(ApiResponse<bool>.Fail("Vui lòng cung cấp trạng thái mới (Status hoặc NewStatus)."));

            var currentAdminId = user.GetAccountId();
            return Results.Ok(await mediator.Send(new ChangeStatusRequest(id, newStatus.Value, currentAdminId), ct));
        })
        .WithSummary("Change user status (Admin only)")
        .RequireAuthorization("AdminOnly");

        return app;
    }
}
