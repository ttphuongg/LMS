using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.SearchAccountIds;

public sealed class SearchAccountIdsHandler : IRequestHandler<SearchAccountIdsQuery, List<int>>
{
    private readonly IdentityDbContext _db;

    public SearchAccountIdsHandler(IdentityDbContext db) => _db = db;

    public async Task<List<int>> Handle(SearchAccountIdsQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Keyword))
            return [];

        var kw = request.Keyword.Trim().ToLower();

        return await _db.Accounts
            .AsNoTracking()
            .Where(a => a.Username.ToLower().Contains(kw) ||
                        a.FullName.ToLower().Contains(kw) ||
                        a.Email.ToLower().Contains(kw))
            .Select(a => a.Id)
            .Take(1000)
            .ToListAsync(ct);
    }
}

