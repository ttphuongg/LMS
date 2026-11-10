using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Persistence;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.BorrowBook;

public record BorrowBookRequest(
    int AccountId,
    int? LibrarianId,
    DateOnly DueDate,
    List<int> BookCopyIds,
    string? Notes = null
) : IRequest<ApiResponse<long>>, ITransactionalCommand;
