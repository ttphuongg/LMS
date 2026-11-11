using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.GetAccountNames;

public sealed class GetAccountNamesHandler : IRequestHandler<GetAccountNamesQuery, IReadOnlyDictionary<int, string>>
{
    private readonly IdentityDbContext _db;

    public GetAccountNamesHandler(IdentityDbContext db) => _db = db;

    public async Task<IReadOnlyDictionary<int, string>> Handle(GetAccountNamesQuery request, CancellationToken ct)
    {
        if (request.AccountIds.Count == 0)
            return new Dictionary<int, string>();

        var accounts = await _db.Accounts
            .Where(a => request.AccountIds.Contains(a.Id))
            .Select(a => new { a.Id, a.FullName })
            .ToDictionaryAsync(a => a.Id, a => a.FullName, ct);

        return accounts;
    }
}

