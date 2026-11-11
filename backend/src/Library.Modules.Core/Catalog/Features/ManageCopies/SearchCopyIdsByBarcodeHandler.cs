using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageCopies;

public sealed class SearchCopyIdsByBarcodeHandler : IRequestHandler<SearchCopyIdsByBarcodeQuery, List<int>>
{
    private readonly CatalogDbContext _db;

    public SearchCopyIdsByBarcodeHandler(CatalogDbContext db) => _db = db;

    public async Task<List<int>> Handle(SearchCopyIdsByBarcodeQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Keyword))
            return [];

        var kw = request.Keyword.Trim();

        return await _db.BookCopies
            .AsNoTracking()
            .Where(c => EF.Functions.Like(c.Barcode, $"%{kw}%"))
            .Select(c => c.Id)
            .Take(200)
            .ToListAsync(ct);
    }
}

