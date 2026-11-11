using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.GetBookDetails;

public record GetBookDetailsRequest(int BookId) : IRequest<ApiResponse<BookDetailResult>>;

public record BookDetailResult(
    int Id, string Title, string? Isbn, string? Description, 
    int? PublishedYear, string? Publisher, string? Language, 
    int? PageCount, decimal? BookValue, string? CoverImageUrl,
    List<string> Authors, List<string> Categories,
    List<int> AuthorIds, List<int> CategoryIds,
    int AvailableCopies, int TotalCopies,
    string Status
);