using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetAllLoans;

public record GetAllLoansRequest(int? Status, int Page, int PageSize) : IRequest<ApiResponse<GetAllLoansResult>>;
public record GetAllLoansResult(List<LoanSummaryDto> Items, int TotalCount);
public record LoanSummaryDto(long Id, int AccountId, int? LibrarianId, DateTime BorrowedAt, string Status, int DetailCount, string? ReaderName = null);
