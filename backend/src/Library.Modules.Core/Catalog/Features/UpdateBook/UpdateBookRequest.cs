using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.UpdateBook;

public record UpdateBookRequest(
    string Title,
    string? Isbn,
    string? Description,
    int? PublishedYear,
    string? Publisher,
    string? Language,
    int PageCount,
    decimal BookValue,
    string? CoverImageUrl,
    List<int> AuthorIds,
    List<int> CategoryIds
) : IRequest<ApiResponse<bool>>
{
    public int BookId { get; set; }
}
