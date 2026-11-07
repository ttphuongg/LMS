using Library.Modules.Core.Billing.Contracts;
using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record FineIssuedEvent(
    long FineId,
    int AccountId,
    decimal Amount,
    FineType FineType
) : INotification;

