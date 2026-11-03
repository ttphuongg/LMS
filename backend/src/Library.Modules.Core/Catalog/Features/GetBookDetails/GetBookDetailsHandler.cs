using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.GetBookDetails;

public sealed class GetBookDetailsHandler : IRequestHandler<GetBookDetailsRequest, ApiResponse<BookDetailResult>>
{
    private readonly AppDbContext _db;
    public GetBookDetailsHandler(AppDbContext db) => _db = db;

    public async Task<ApiResponse<BookDetailResult>> Handle(GetBookDetailsRequest request, CancellationToken ct)
    {
        var book = await _db.Books
            .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
            .Include(b => b.BookCategories).ThenInclude(bc => bc.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BookId, ct);

        if (book == null) return ApiResponse<BookDetailResult>.Fail("Sách không t?n t?i.");

        var result = new BookDetailResult(
            book.Id, book.Title, book.Isbn, book.Description,
            book.PublishedYear, book.Publisher, book.Language,
            book.PageCount, book.BookValue, book.CoverImageUrl,
            book.BookAuthors.Select(ba => ba.Author.Name).ToList(),
            book.BookCategories.Select(bc => bc.Category.Name).ToList()
        );

        return ApiResponse<BookDetailResult>.Ok(result);
    }
}
