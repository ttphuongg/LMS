using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.RequestRenewal;

public record RequestRenewalRequest(
    long LoanSlipDetailId,
    int AccountId,
    DateOnly NewDueDate,
    string? Reason = null
) : IRequest<ApiResponse<long>>;
