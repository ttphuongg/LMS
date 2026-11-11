using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.FindAvailableCopy;

public sealed class FindAvailableCopyHandler : IRequestHandler<FindAvailableCopyQuery, CopyInfo?>
{
    private readonly CatalogDbContext _db;

    public FindAvailableCopyHandler(CatalogDbContext db) => _db = db;

    public async Task<CopyInfo?> Handle(FindAvailableCopyQuery request, CancellationToken ct)
    {
        IQueryable<BookCopy> query = _db.BookCopies
            .Include(c => c.Book)
            .Include(c => c.Location)
            .Where(c => c.BookId == request.BookId && c.Status == CopyStatus.Available);

        if (request.PreferredCopyId.HasValue)
        {
            var preferred = await query.FirstOrDefaultAsync(c => c.Id == request.PreferredCopyId.Value, ct);
            if (preferred != null)
            {
                return ToCopyInfo(preferred);
            }
        }

        var copy = await query.FirstOrDefaultAsync(ct);
        if (copy == null) return null;

        return ToCopyInfo(copy);
    }

    private static CopyInfo ToCopyInfo(BookCopy copy) => new(
        copy.Id,
        copy.Barcode,
        copy.BookId,
        copy.Book.Title,
        copy.Book.Status == BookStatus.Active,
        copy.Condition,
        copy.Status,
        copy.Location != null
            ? $"{copy.Location.Aisle} - {copy.Location.Shelf} - Tầng {copy.Location.RowLevel}"
            : null);
}

