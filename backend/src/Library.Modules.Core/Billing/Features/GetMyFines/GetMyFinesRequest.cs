using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Billing.Features.GetMyFines;

public record GetMyFinesRequest(int AccountId) : IRequest<ApiResponse<List<FineDto>>>;
public record FineDto(long Id, string FineType, decimal Amount, string Status, DateOnly? DueDate, DateTime IssuedAt);
