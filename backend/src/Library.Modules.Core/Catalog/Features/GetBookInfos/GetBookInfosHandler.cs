using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.GetBookInfos;

public sealed class GetBookInfosHandler : IRequestHandler<GetBookInfosQuery, IReadOnlyDictionary<int, BookInfo>>
{
    private readonly CatalogDbContext _db;

    public GetBookInfosHandler(CatalogDbContext db) => _db = db;

    public async Task<IReadOnlyDictionary<int, BookInfo>> Handle(GetBookInfosQuery request, CancellationToken ct)
    {
        if (request.BookIds.Count == 0)
            return new Dictionary<int, BookInfo>();

        var distinctIds = request.BookIds.Distinct().ToList();

        var books = await _db.Books
            .AsNoTracking()
            .Where(b => distinctIds.Contains(b.Id))
            .Select(b => new BookInfo(
                b.Id,
                b.Title,
                b.Status == BookStatus.Active))
            .ToDictionaryAsync(b => b.BookId, ct);

        return books;
    }
}

