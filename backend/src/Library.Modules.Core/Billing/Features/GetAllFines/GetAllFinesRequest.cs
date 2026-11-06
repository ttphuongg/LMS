using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Billing.Features.GetAllFines;

public record GetAllFinesRequest(int? Status, int Page, int PageSize) : IRequest<ApiResponse<GetAllFinesResult>>;
public record GetAllFinesResult(List<FineSummaryDto> Items, int TotalCount);
public record FineSummaryDto(long Id, int AccountId, string FineType, decimal Amount, string Status, DateTime IssuedAt);
