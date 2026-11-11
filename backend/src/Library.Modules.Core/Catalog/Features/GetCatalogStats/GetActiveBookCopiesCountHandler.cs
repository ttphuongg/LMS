using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.GetCatalogStats;

public sealed class GetActiveBookCopiesCountHandler : IRequestHandler<GetActiveBookCopiesCountQuery, int>
{
    private readonly CatalogDbContext _db;

    public GetActiveBookCopiesCountHandler(CatalogDbContext db) => _db = db;

    public async Task<int> Handle(GetActiveBookCopiesCountQuery request, CancellationToken ct)
    {
        return await _db.BookCopies
            .AsNoTracking()
            .CountAsync(c =>
                c.Status != CopyStatus.Inactive &&
                c.Book.Status == BookStatus.Active, ct);
    }
}

public sealed class GetActiveBookTitlesCountHandler : IRequestHandler<GetActiveBookTitlesCountQuery, int>
{
    private readonly CatalogDbContext _db;

    public GetActiveBookTitlesCountHandler(CatalogDbContext db) => _db = db;

    public async Task<int> Handle(GetActiveBookTitlesCountQuery request, CancellationToken ct)
    {
        return await _db.Books
            .AsNoTracking()
            .CountAsync(b => b.Status == BookStatus.Active, ct);
    }
}

