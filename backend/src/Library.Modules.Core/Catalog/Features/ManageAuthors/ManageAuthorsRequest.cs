using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.ManageAuthors;

public record AddAuthorRequest(string Name, string? Biography) : IRequest<ApiResponse<int>>;
public record GetAuthorsRequest(string? Keyword) : IRequest<ApiResponse<List<AuthorDto>>>;
public record AuthorDto(int Id, string Name, string? Biography);
