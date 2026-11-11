using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.GetAccountsCount;

public sealed class GetTotalAccountsCountHandler : IRequestHandler<GetTotalAccountsCountQuery, int>
{
    private readonly IdentityDbContext _db;

    public GetTotalAccountsCountHandler(IdentityDbContext db) => _db = db;

    public async Task<int> Handle(GetTotalAccountsCountQuery request, CancellationToken ct)
    {
        return await _db.Accounts.AsNoTracking().CountAsync(ct);
    }
}

