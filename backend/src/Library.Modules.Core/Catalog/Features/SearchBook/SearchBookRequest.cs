using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.SearchBook;

public record SearchBookRequest(
    string? Keyword,
    int? AuthorId,
    int? CategoryId,
    string? Language,
    short? PublishedYear,
    int Page = 1,
    int PageSize = 20,
    BookStatus? Status = null,
    bool IncludeInactive = false
) : IRequest<ApiResponse<SearchBookResult>>;

public record SearchBookResult(List<BookSummary> Items, int TotalCount);

public record BookSummary(
    int Id,
    string Title,
    string? Isbn,
    string? Publisher,
    short? PublishedYear,
    string? CoverImageUrl,
    int AvailableCopies,
    int TotalCopies = 0,
    List<string>? Authors = null,
    List<string>? Categories = null,
    string? Description = null,
    string Status = "Active"
);
