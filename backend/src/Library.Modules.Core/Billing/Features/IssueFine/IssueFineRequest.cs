using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Billing.Features.IssueFine;

public record IssueFineRequest(
    int AccountId,
    long? LoanSlipDetailId,
    long? IncidentId,
    FineType FineType,
    decimal Amount,
    DateOnly? PaymentDueDate
) : IRequest<ApiResponse<long>>;
