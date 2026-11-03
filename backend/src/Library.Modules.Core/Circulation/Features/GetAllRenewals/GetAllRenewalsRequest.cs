using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetAllRenewals;

public record GetAllRenewalsRequest(int? Status, int Page, int PageSize) : IRequest<ApiResponse<GetAllRenewalsResult>>;

public record GetAllRenewalsResult(List<RenewalItemDto> Items, int TotalCount);

public record RenewalItemDto(
    long Id,
    long LoanSlipDetailId,
    long LoanSlipId,
    int AccountId,
    string? ReaderName,
    int BookCopyId,
    string? Barcode,
    string? BookTitle,
    byte RenewalNumber,
    DateTime RequestedAt,
    DateOnly OldDueDate,
    DateOnly NewDueDate,
    string Status,
    string? Reason,
    int? LibrarianId
);
