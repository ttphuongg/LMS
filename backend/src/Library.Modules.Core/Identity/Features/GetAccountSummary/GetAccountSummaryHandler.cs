using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.GetAccountSummary;

public sealed class GetAccountSummaryHandler : IRequestHandler<GetAccountSummaryQuery, AccountSummary?>
{
    private readonly IdentityDbContext _db;

    public GetAccountSummaryHandler(IdentityDbContext db) => _db = db;

    public async Task<AccountSummary?> Handle(GetAccountSummaryQuery request, CancellationToken ct)
    {
        var account = await _db.Accounts
            .Where(a => a.Id == request.AccountId)
            .Select(a => new AccountSummary(a.Id, a.FullName, a.Status == AccountStatus.Active, a.Username))
            .FirstOrDefaultAsync(ct);

        return account;
    }
}

