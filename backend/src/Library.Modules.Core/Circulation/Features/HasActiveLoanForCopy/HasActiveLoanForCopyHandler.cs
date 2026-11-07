using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.HasActiveLoanForCopy;

public sealed class HasActiveLoanForCopyHandler : IRequestHandler<HasActiveLoanForCopyQuery, bool>
{
    private readonly AppDbContext _db;

    public HasActiveLoanForCopyHandler(AppDbContext db) => _db = db;

    public async Task<bool> Handle(HasActiveLoanForCopyQuery request, CancellationToken ct)
    {
        return await _db.LoanSlipDetails
            .AsNoTracking()
            .AnyAsync(d => d.BookCopyId == request.CopyId && d.Status == LoanDetailStatus.Borrowing, ct);
    }
}

