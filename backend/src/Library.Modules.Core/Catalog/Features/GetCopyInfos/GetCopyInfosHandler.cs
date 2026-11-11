using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.GetCopyInfos;

public sealed class GetCopyInfosHandler : IRequestHandler<GetCopyInfosQuery, IReadOnlyDictionary<int, CopyInfo>>
{
    private readonly CatalogDbContext _db;

    public GetCopyInfosHandler(CatalogDbContext db) => _db = db;

    public async Task<IReadOnlyDictionary<int, CopyInfo>> Handle(GetCopyInfosQuery request, CancellationToken ct)
    {
        if (request.CopyIds.Count == 0)
            return new Dictionary<int, CopyInfo>();

        var copies = await _db.BookCopies
            .Include(c => c.Book)
            .Include(c => c.Location)
            .Where(c => request.CopyIds.Contains(c.Id))
            .Select(c => new CopyInfo(
                c.Id,
                c.Barcode,
                c.BookId,
                c.Book.Title,
                c.Book.Status == BookStatus.Active,
                c.Condition,
                c.Status,
                c.Location != null
                    ? c.Location.Aisle + " - " + c.Location.Shelf + " - Tầng " + c.Location.RowLevel
                    : null))
            .ToDictionaryAsync(c => c.CopyId, c => c, ct);

        return copies;
    }
}

