using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.SearchBook;

public sealed class SearchBookHandler : IRequestHandler<SearchBookRequest, ApiResponse<SearchBookResult>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<SearchBookRequest> _validator;

    public SearchBookHandler(CatalogDbContext db, IValidator<SearchBookRequest> validator)
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

        // ── Build base query (public sees Active only; staff can filter/include Inactive) ──
        var isPostgres = _db.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL";
        IQueryable<Book> query = _db.Books.AsNoTracking();
        if (request.Status.HasValue)
        {
            query = query.Where(b => b.Status == request.Status.Value);
        }
        else if (!request.IncludeInactive)
        {
            query = query.Where(b => b.Status == BookStatus.Active);
        }

        // ── Apply filters (Hybrid Search: PostgreSQL Full-Text Search + ILIKE, InMemory fallback) ──
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim();
            if (isPostgres)
            {
                query = query.Where(b =>
                    (b.SearchVector != null && b.SearchVector.Matches(EF.Functions.PlainToTsQuery("simple", keyword))) ||
                    EF.Functions.ILike(b.Title, $"%{keyword}%") ||
                    (b.Isbn != null && EF.Functions.ILike(b.Isbn, $"%{keyword}%")) ||
                    (b.Description != null && EF.Functions.ILike(b.Description, $"%{keyword}%")) ||
                    b.BookAuthors.Any(ba => EF.Functions.ILike(ba.Author.Name, $"%{keyword}%")));
            }
            else
            {
                query = query.Where(b =>
                    EF.Functions.Like(b.Title, $"%{keyword}%") ||
                    (b.Isbn != null && EF.Functions.Like(b.Isbn, $"%{keyword}%")) ||
                    (b.Description != null && EF.Functions.Like(b.Description, $"%{keyword}%")) ||
                    b.BookAuthors.Any(ba => EF.Functions.Like(ba.Author.Name, $"%{keyword}%")));
            }
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
            var lang = request.Language.Trim();
            if (isPostgres)
            {
                query = query.Where(b => b.Language != null && EF.Functions.ILike(b.Language, lang));
            }
            else
            {
                query = query.Where(b => b.Language != null && EF.Functions.Like(b.Language, lang));
            }
        }

        if (request.PublishedYear.HasValue)
        {
            query = query.Where(b => b.PublishedYear == request.PublishedYear.Value);
        }

        // ── Count total before pagination ─────────────────────────────────────
        var totalCount = await query.CountAsync(ct);

        // ── Project + paginate (Relevance ranking when searching by keyword in PostgreSQL) ──
        IOrderedQueryable<Book> orderedQuery;
        if (isPostgres && !string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim();
            orderedQuery = query
                .OrderByDescending(b => b.SearchVector!.Rank(EF.Functions.PlainToTsQuery("simple", keyword)))
                .ThenByDescending(b => b.CreatedAt)
                .ThenBy(b => b.Title);
        }
        else
        {
            orderedQuery = query
                .OrderByDescending(b => b.CreatedAt)
                .ThenBy(b => b.Title);
        }

        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BookSummary(
                b.Id,
                b.Title,
                b.Isbn,
                b.Publisher,
                b.PublishedYear,
                b.CoverImageUrl,
                b.Copies.Count(c => c.Status == CopyStatus.Available),
                b.Copies.Count(),
                b.BookAuthors.Select(ba => ba.Author.Name).ToList(),
                b.BookCategories.Select(bc => bc.Category.Name).ToList(),
                b.Description,
                b.Status.ToString()
            ))
            .ToListAsync(ct);

        return ApiResponse<SearchBookResult>.Ok(new SearchBookResult(items, totalCount));
    }
}
