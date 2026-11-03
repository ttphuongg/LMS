using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.SearchBook;

public sealed class SearchBookHandler : IRequestHandler<SearchBookRequest, ApiResponse<SearchBookResult>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<SearchBookRequest> _validator;

    public SearchBookHandler(AppDbContext db, IValidator<SearchBookRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<SearchBookResult>> Handle(SearchBookRequest request, CancellationToken ct)
    {
        // ── Validate input ────────────────────────────────────────────────────
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<SearchBookResult>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // ── Build base query (only Active books) ──────────────────────────────
        IQueryable<Book> query = _db.Books
            .Where(b => b.Status == BookStatus.Active)
            .AsNoTracking();

        // ── Apply filters ─────────────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim().ToLower();
            query = query.Where(b =>
                b.Title.ToLower().Contains(keyword) ||
                (b.Isbn != null && b.Isbn.ToLower().Contains(keyword)) ||
                (b.Description != null && b.Description.ToLower().Contains(keyword)));
        }

        if (request.AuthorId.HasValue)
        {
            query = query.Where(b =>
                b.BookAuthors.Any(ba => ba.AuthorId == request.AuthorId.Value));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(b =>
                b.BookCategories.Any(bc => bc.CategoryId == request.CategoryId.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.Language))
        {
            var lang = request.Language.Trim().ToLower();
            query = query.Where(b => b.Language != null && b.Language.ToLower() == lang);
        }

        if (request.PublishedYear.HasValue)
        {
            query = query.Where(b => b.PublishedYear == request.PublishedYear.Value);
        }

        // ── Count total before pagination ─────────────────────────────────────
        var totalCount = await query.CountAsync(ct);

        // ── Project + paginate ────────────────────────────────────────────────
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .ThenBy(b => b.Title)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BookSummary(
                b.Id,
                b.Title,
                b.Isbn,
                b.Publisher,
                b.PublishedYear,
                b.CoverImageUrl,
                b.Copies.Count(c => c.Status == CopyStatus.Available)
            ))
            .ToListAsync(ct);

        return ApiResponse<SearchBookResult>.Ok(new SearchBookResult(items, totalCount));
    }
}
