using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetLoanDetail;

public record GetLoanDetailRequest(long LoanSlipId) : IRequest<ApiResponse<LoanSlipDetailResult>>;

public record LoanSlipDetailResult(
    long LoanSlipId,
    int AccountId,
    string? ReaderName,
    string? ReaderUsername,
    int? LibrarianId,
    DateTime BorrowedAt,
    DateOnly DueDate,
    DateOnly? ReturnedDate,
    string Status,
    string? Notes,
    List<LoanItemDto> Items
);

public record LoanItemDto(
    long DetailId,
    int BookCopyId,
    string? Barcode,
    int? BookId,
    string? BookTitle,
    string Status,
    DateOnly? ActualReturnDate,
    string? Notes,
    int RenewalsCount
);
