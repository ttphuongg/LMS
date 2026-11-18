using System.Security.Claims;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Circulation.Features.GetCirculationEligibility;

public static class GetCirculationEligibilityEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        // 1. Cho bạn đọc tự kiểm tra tình trạng của mình
        app.MapGet("/api/circulation/my-eligibility",
            async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                var accountId = user.GetAccountId();
                var result = await mediator.Send(new GetCirculationEligibilityRequest(accountId), ct);
                return Results.Ok(result);
            })
            .WithTags("Circulation")
            .WithSummary("Check current user's eligibility to borrow and reserve books")
            .RequireAuthorization();

        // 2. Cho Thủ thư / Quản trị viên kiểm tra bạn đọc tại quầy
        app.MapGet("/api/circulation/eligibility/{accountId:int}",
            async (int accountId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            {
                if (!user.IsStaff())
                {
                    return Results.Forbid();
                }

                var result = await mediator.Send(new GetCirculationEligibilityRequest(accountId), ct);
                return Results.Ok(result);
            })
            .WithTags("Circulation")
            .WithSummary("Check reader's eligibility to borrow and reserve books (Staff only)")
            .RequireAuthorization();

        return app;
    }
}

