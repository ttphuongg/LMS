using Library.Modules.Core.Search.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Search.Features.LogSearch;

public sealed class LogSearchHandler : IRequestHandler<LogSearchRequest, ApiResponse<long>>
{
    private readonly SearchDbContext _db;
    public LogSearchHandler(SearchDbContext db) => _db = db;

    public async Task<ApiResponse<long>> Handle(LogSearchRequest request, CancellationToken ct)
    {
        var history = new SearchHistory
        {
            AccountId = request.AccountId,
            Keyword = request.Keyword,
            SearchType = request.SearchType,
            ResultCount = request.ResultCount,
            SearchedAt = DateTime.UtcNow
        };

        _db.SearchHistories.Add(history);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<long>.Ok(history.Id);
    }
}
