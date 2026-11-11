using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Search.Features.LogSearch;

public record LogSearchRequest(
    int AccountId,
    string Keyword,
    string SearchType = "BOOK",
    int? ResultCount = null
) : IRequest<ApiResponse<long>>;
