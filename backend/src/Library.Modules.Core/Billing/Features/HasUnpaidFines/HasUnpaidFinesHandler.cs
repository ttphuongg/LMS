using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.HasUnpaidFines;

public sealed class HasUnpaidFinesHandler : IRequestHandler<HasUnpaidFinesQuery, bool>
{
    private readonly BillingDbContext _db;

    public HasUnpaidFinesHandler(BillingDbContext db) => _db = db;

    public async Task<bool> Handle(HasUnpaidFinesQuery request, CancellationToken ct)
    {
        return await _db.Fines.AnyAsync(
            f => f.AccountId == request.AccountId && f.Status == FineStatus.Unpaid,
            ct);
    }
}

