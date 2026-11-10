using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.AddBook;

public sealed class AddBookHandler : IRequestHandler<AddBookRequest, ApiResponse<int>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<AddBookRequest> _validator;

    public AddBookHandler(CatalogDbContext db, IValidator<AddBookRequest> validator)
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

        // ── Normalize and check ISBN uniqueness ────────────────────────────────
        var isbn = string.IsNullOrWhiteSpace(request.Isbn) ? null : request.Isbn.Trim();
        if (isbn != null)
        {
            if (await _db.Books.AnyAsync(b => b.Isbn == isbn, ct))
                return ApiResponse<int>.Fail($"ISBN '{isbn}' đã tồn tại trong hệ thống.");
        }

        // ── Verify AuthorIds exist ────────────────────────────────────────────
        var distinctAuthorIds = request.AuthorIds?.Distinct().ToList() ?? [];
        if (distinctAuthorIds.Count > 0)
        {
            var existingAuthorCount = await _db.Authors
                .CountAsync(a => distinctAuthorIds.Contains(a.Id), ct);

            if (existingAuthorCount != distinctAuthorIds.Count)
                return ApiResponse<int>.Fail("Một hoặc nhiều tác giả không tồn tại.");
        }

        // ── Verify CategoryIds exist ──────────────────────────────────────────
        var distinctCategoryIds = request.CategoryIds?.Distinct().ToList() ?? [];
        if (distinctCategoryIds.Count > 0)
        {
            var existingCategoryCount = await _db.Categories
                .CountAsync(c => distinctCategoryIds.Contains(c.Id), ct);

            if (existingCategoryCount != distinctCategoryIds.Count)
                return ApiResponse<int>.Fail("Một hoặc nhiều thể loại không tồn tại.");
        }

        // ── Create Book entity ────────────────────────────────────────────────
        var book = new Book
        {
            Title = request.Title.Trim(),
            Isbn = isbn,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            PublishedYear = request.PublishedYear,
            Publisher = string.IsNullOrWhiteSpace(request.Publisher) ? null : request.Publisher.Trim(),
            Language = string.IsNullOrWhiteSpace(request.Language) ? null : request.Language.Trim(),
            PageCount = request.PageCount,
            BookValue = request.BookValue,
            CoverImageUrl = string.IsNullOrWhiteSpace(request.CoverImageUrl) ? null : request.CoverImageUrl.Trim(),
            Status = BookStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        // ── Attach many-to-many relationships ─────────────────────────────────
        foreach (var authorId in distinctAuthorIds)
            book.BookAuthors.Add(new BookAuthor { AuthorId = authorId });

        foreach (var categoryId in distinctCategoryIds)
            book.BookCategories.Add(new BookCategory { CategoryId = categoryId });

        _db.Books.Add(book);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(book.Id);
    }
}
