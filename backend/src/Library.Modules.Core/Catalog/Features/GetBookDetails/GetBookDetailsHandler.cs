using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.GetBookDetails;

public sealed class GetBookDetailsHandler : IRequestHandler<GetBookDetailsRequest, ApiResponse<BookDetailResult>>
{
    private readonly CatalogDbContext _db;
    public GetBookDetailsHandler(CatalogDbContext db) => _db = db;

    public async Task<ApiResponse<BookDetailResult>> Handle(GetBookDetailsRequest request, CancellationToken ct)
    {
        var book = await _db.Books
            .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
            .Include(b => b.BookCategories).ThenInclude(bc => bc.Category)
            .Include(b => b.Copies)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BookId, ct);

        if (book == null) return ApiResponse<BookDetailResult>.Fail("Sách không tồn tại.");

        var availableCopies = book.Copies.Count(c => c.Status == CopyStatus.Available);
        var totalCopies = book.Copies.Count;

        var result = new BookDetailResult(
            book.Id, book.Title, book.Isbn, book.Description,
            book.PublishedYear, book.Publisher, book.Language,
            book.PageCount, book.BookValue, book.CoverImageUrl,
            book.BookAuthors.Select(ba => ba.Author.Name).ToList(),
            book.BookCategories.Select(bc => bc.Category.Name).ToList(),
            book.BookAuthors.Select(ba => ba.AuthorId).ToList(),
            book.BookCategories.Select(bc => bc.CategoryId).ToList(),
            availableCopies,
            totalCopies,
            book.Status.ToString()
        );

        return ApiResponse<BookDetailResult>.Ok(result);
    }
}
