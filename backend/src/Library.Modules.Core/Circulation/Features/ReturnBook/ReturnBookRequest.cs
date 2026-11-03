using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public record ReturnBookRequest(
    long LoanSlipId,
    int LibrarianId,
    List<ReturnedCopy> ReturnedCopies
) : IRequest<ApiResponse<bool>>;

public record ReturnedCopy(long LoanSlipDetailId, string? Notes = null);
