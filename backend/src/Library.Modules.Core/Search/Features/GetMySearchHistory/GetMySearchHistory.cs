using Library.Modules.Core.Search.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Library.Modules.Core.Search.Features.GetMySearchHistory;

public record SearchHistoryItemDto(
    long Id,
    string Keyword,
    string SearchType,
    int? ResultCount,
    DateTime SearchedAt
);

public record GetMySearchHistoryRequest(int AccountId, int Limit = 10) : IRequest<ApiResponse<List<SearchHistoryItemDto>>>;

public sealed class GetMySearchHistoryHandler : IRequestHandler<GetMySearchHistoryRequest, ApiResponse<List<SearchHistoryItemDto>>>
{
    private readonly SearchDbContext _db;

    public GetMySearchHistoryHandler(SearchDbContext db) => _db = db;

    public async Task<ApiResponse<List<SearchHistoryItemDto>>> Handle(GetMySearchHistoryRequest request, CancellationToken ct)
    {
        var limit = Math.Clamp(request.Limit, 1, 50);

        var items = await _db.SearchHistories
            .AsNoTracking()
            .Where(sh => sh.AccountId == request.AccountId)
            .OrderByDescending(sh => sh.SearchedAt)
            .ThenByDescending(sh => sh.Id)
            .Take(limit)
            .Select(sh => new SearchHistoryItemDto(
                sh.Id,
                sh.Keyword,
                sh.SearchType,
                sh.ResultCount,
                VietnamTime.SpecifyUtc(sh.SearchedAt)))
            .ToListAsync(ct);

        return ApiResponse<List<SearchHistoryItemDto>>.Ok(items);
    }
}

public static class GetMySearchHistoryEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search/history",
            async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct, int limit = 10) =>
                Results.Ok(await mediator.Send(new GetMySearchHistoryRequest(user.GetAccountId(), limit), ct)))
           .WithTags("Search")
           .WithSummary("Get current user's recent search history")
           .RequireAuthorization();

        return app;
    }
}

