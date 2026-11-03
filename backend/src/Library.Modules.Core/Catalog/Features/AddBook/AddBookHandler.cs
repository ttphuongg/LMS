using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.AddBook;

public sealed class AddBookHandler : IRequestHandler<AddBookRequest, ApiResponse<int>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<AddBookRequest> _validator;

    public AddBookHandler(AppDbContext db, IValidator<AddBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<int>> Handle(AddBookRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<int>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Check ISBN uniqueness ─────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.Isbn))
        {
            var isbn = request.Isbn.Trim();
            if (await _db.Books.AnyAsync(b => b.Isbn == isbn, ct))
                return ApiResponse<int>.Fail($"ISBN '{isbn}' đã tồn tại trong hệ thống.");
        }

        // ── Verify AuthorIds exist ────────────────────────────────────────────
        if (request.AuthorIds.Count > 0)
        {
            var existingAuthorCount = await _db.Authors
                .CountAsync(a => request.AuthorIds.Contains(a.Id), ct);

            if (existingAuthorCount != request.AuthorIds.Count)
                return ApiResponse<int>.Fail("Một hoặc nhiều tác giả không tồn tại.");
        }

        // ── Verify CategoryIds exist ──────────────────────────────────────────
        if (request.CategoryIds.Count > 0)
        {
            var existingCategoryCount = await _db.Categories
                .CountAsync(c => request.CategoryIds.Contains(c.Id), ct);

            if (existingCategoryCount != request.CategoryIds.Count)
                return ApiResponse<int>.Fail("Một hoặc nhiều thể loại không tồn tại.");
        }

        // ── Create Book entity ────────────────────────────────────────────────
        var book = new Book
        {
            Title = request.Title.Trim(),
            Isbn = request.Isbn?.Trim(),
            Description = request.Description?.Trim(),
            PublishedYear = request.PublishedYear,
            Publisher = request.Publisher?.Trim(),
            Language = request.Language?.Trim(),
            PageCount = request.PageCount,
            BookValue = request.BookValue,
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            Status = BookStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        // ── Attach many-to-many relationships ─────────────────────────────────
        foreach (var authorId in request.AuthorIds.Distinct())
            book.BookAuthors.Add(new BookAuthor { AuthorId = authorId });

        foreach (var categoryId in request.CategoryIds.Distinct())
            book.BookCategories.Add(new BookCategory { CategoryId = categoryId });

        _db.Books.Add(book);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(book.Id);
    }
}
