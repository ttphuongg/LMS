using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record ReservationExpiredEvent(
    long ReservationId,
    int AccountId
) : INotification;