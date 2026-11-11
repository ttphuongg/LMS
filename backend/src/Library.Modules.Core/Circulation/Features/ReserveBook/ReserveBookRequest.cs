using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ReserveBook;

public record ReserveBookRequest(
    int AccountId,
    int BookId,
    int? BookCopyId = null
) : IRequest<ApiResponse<long>>;
