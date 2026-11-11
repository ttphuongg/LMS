using MediatR;
using Library.Modules.Core.Billing.Data;

namespace Library.Modules.Core.Shared.Events;

public record FineIssuedEvent(
    long FineId,
    int AccountId,
    decimal Amount,
    FineType FineType
) : INotification;
