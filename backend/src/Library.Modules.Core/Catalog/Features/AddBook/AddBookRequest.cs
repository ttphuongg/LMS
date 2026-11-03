using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.AddBook;

public record AddBookRequest(
    string Title,
    string? Isbn,
    string? Description,
    short? PublishedYear,
    string? Publisher,
    string? Language,
    int? PageCount,
    decimal? BookValue,
    string? CoverImageUrl,
    List<int> AuthorIds,
    List<int> CategoryIds
) : IRequest<ApiResponse<int>>;
