using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public record GetAllFinesRequest(int? Status, int Page, int PageSize, string? Keyword = null) : IRequest<ApiResponse<GetAllFinesResult>>;
public record FineSummary(
    decimal TotalFineAmount,
    decimal TotalPaidAmount,
    decimal TotalRemainingAmount
);
public record GetAllFinesResult(List<FineSummaryDto> Items, int TotalCount, FineSummary? Summary = null);
public record FineSummaryDto(
    long Id,
    int AccountId,
    string FineType,
    decimal Amount,
    string Status,
    DateTime IssuedAt,
    string? ReaderName = null
);
