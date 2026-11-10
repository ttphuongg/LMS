using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Billing.Features.PayFine;

public record PayFineBody(
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    string? Notes = null
);

public record PayFineRequest(
    long FineId,
    int? LibrarianId,
    PaymentMethod PaymentMethod,
    string? Notes = null
) : IRequest<ApiResponse<bool>>;
