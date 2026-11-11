using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.GetUnpaidFinesTotal;

public sealed class GetUnpaidFinesTotalHandler : IRequestHandler<GetUnpaidFinesTotalQuery, decimal>
{
    private readonly BillingDbContext _db;

    public GetUnpaidFinesTotalHandler(BillingDbContext db) => _db = db;

    public async Task<decimal> Handle(GetUnpaidFinesTotalQuery request, CancellationToken ct)
    {
        return await _db.Fines
            .AsNoTracking()
            .Where(f => f.Status == FineStatus.Unpaid)
            .SumAsync(f => (decimal?)f.Amount, ct) ?? 0m;
    }
}

