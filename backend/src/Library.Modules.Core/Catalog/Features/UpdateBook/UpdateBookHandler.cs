using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.UpdateBook;

public sealed class UpdateBookHandler : IRequestHandler<UpdateBookRequest, ApiResponse<bool>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<UpdateBookRequest> _validator;

    public UpdateBookHandler(CatalogDbContext db, IValidator<UpdateBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateBookRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid)
            return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var book = await _db.Books
            .Include(b => b.BookAuthors)
            .Include(b => b.BookCategories)
            .FirstOrDefaultAsync(b => b.Id == request.BookId, ct);

        if (book == null)
            return ApiResponse<bool>.Fail("Sách không tồn tại.");

        if (!string.IsNullOrWhiteSpace(request.Isbn) && request.Isbn != book.Isbn)
        {
            if (await _db.Books.AnyAsync(b => b.Isbn == request.Isbn, ct))
                return ApiResponse<bool>.Fail("ISBN đã tồn tại ở một cuốn sách khác.");
        }

        // ── Verify AuthorIds exist ────────────────────────────────────────────
        if (request.AuthorIds.Count > 0)
        {
            var distinctAuthorIds = request.AuthorIds.Distinct().ToList();
            var existingAuthorCount = await _db.Authors
                .CountAsync(a => distinctAuthorIds.Contains(a.Id), ct);

            if (existingAuthorCount != distinctAuthorIds.Count)
                return ApiResponse<bool>.Fail("Một hoặc nhiều tác giả không tồn tại.");
        }

        // ── Verify CategoryIds exist ──────────────────────────────────────────
        if (request.CategoryIds.Count > 0)
        {
            var distinctCategoryIds = request.CategoryIds.Distinct().ToList();
            var existingCategoryCount = await _db.Categories
                .CountAsync(c => distinctCategoryIds.Contains(c.Id), ct);

            if (existingCategoryCount != distinctCategoryIds.Count)
                return ApiResponse<bool>.Fail("Một hoặc nhiều thể loại không tồn tại.");
        }

        book.Title = request.Title.Trim();
        book.Isbn = request.Isbn?.Trim();
        book.Description = request.Description?.Trim();
        book.PublishedYear = (short?)request.PublishedYear;
        book.Publisher = request.Publisher?.Trim();
        book.Language = request.Language?.Trim();
        book.PageCount = request.PageCount;
        book.BookValue = request.BookValue;
        book.CoverImageUrl = request.CoverImageUrl?.Trim();

        _db.BookAuthors.RemoveRange(book.BookAuthors);
        foreach (var aid in request.AuthorIds.Distinct())
            book.BookAuthors.Add(new BookAuthor { AuthorId = aid });

        _db.BookCategories.RemoveRange(book.BookCategories);
        foreach (var cid in request.CategoryIds.Distinct())
            book.BookCategories.Add(new BookCategory { CategoryId = cid });

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
