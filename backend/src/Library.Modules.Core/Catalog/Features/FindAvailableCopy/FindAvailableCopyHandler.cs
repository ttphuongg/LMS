using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.FindAvailableCopy;

public sealed class FindAvailableCopyHandler : IRequestHandler<FindAvailableCopyQuery, CopyInfo?>
{
    private readonly AppDbContext _db;

    public FindAvailableCopyHandler(AppDbContext db) => _db = db;

    public async Task<CopyInfo?> Handle(FindAvailableCopyQuery request, CancellationToken ct)
    {
        var query = _db.BookCopies
            .AsNoTracking()
            .Include(c => c.Book)
            .Where(c => c.BookId == request.BookId && c.Status == CopyStatus.Available);

        if (request.PreferredCopyId.HasValue)
        {
            query = query.Where(c => c.Id == request.PreferredCopyId.Value);
        }

        var copy = await query
            .OrderBy(c => c.Id)
            .Select(c => new CopyInfo(
                c.Id,
                c.Barcode,
                c.BookId,
                c.Book.Title,
                c.Book.Status == BookStatus.Active,
                c.Condition,
                c.Status))
            .FirstOrDefaultAsync(ct);

        return copy;
    }
}

