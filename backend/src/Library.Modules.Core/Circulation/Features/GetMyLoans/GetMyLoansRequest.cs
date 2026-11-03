using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetMyLoans;

public record GetMyLoansRequest(int AccountId) : IRequest<ApiResponse<List<LoanDto>>>;

public record LoanDto(
    long LoanSlipId,
    DateTime BorrowDate,
    string Status,
    List<LoanDetailDto> Details
);

public record LoanDetailDto(
    long DetailId,
    int BookCopyId,
    DateOnly DueDate,
    DateOnly? ReturnedDate,
    string Status,
    int RenewalsCount,
    string? BookTitle = null,
    string? Barcode = null
);
