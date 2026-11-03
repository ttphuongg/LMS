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
    int PageSize = 20
) : IRequest<ApiResponse<SearchBookResult>>;

public record SearchBookResult(List<BookSummary> Items, int TotalCount);

public record BookSummary(
    int Id,
    string Title,
    string? Isbn,
    string? Publisher,
    short? PublishedYear,
    string? CoverImageUrl,
    int AvailableCopies
);
