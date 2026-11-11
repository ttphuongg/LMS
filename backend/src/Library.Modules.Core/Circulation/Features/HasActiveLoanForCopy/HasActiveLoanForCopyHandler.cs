using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.HasActiveLoanForCopy;

public sealed class HasActiveLoanForCopyHandler : IRequestHandler<HasActiveLoanForCopyQuery, bool>
{
    private readonly CirculationDbContext _db;

    public HasActiveLoanForCopyHandler(CirculationDbContext db) => _db = db;

    public async Task<bool> Handle(HasActiveLoanForCopyQuery request, CancellationToken ct)
    {
        return await _db.LoanSlipDetails.AnyAsync(
            d => d.BookCopyId == request.CopyId && d.Status == LoanDetailStatus.Borrowing, ct);
    }
}

