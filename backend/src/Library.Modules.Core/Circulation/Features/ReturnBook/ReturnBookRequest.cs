using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Persistence;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public record ReturnBookRequest(
    long LoanSlipId,
    int LibrarianId,
    List<ReturnedCopy> ReturnedCopies
) : IRequest<ApiResponse<bool>>, ITransactionalCommand;

public record ReturnedCopy(long LoanSlipDetailId, string? Notes = null, CopyCondition? Condition = null);
