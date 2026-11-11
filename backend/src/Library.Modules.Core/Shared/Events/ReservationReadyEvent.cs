using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record ReservationReadyEvent(
    long ReservationId,
    int AccountId,
    int? BookCopyId,
    DateTime? ExpiresAt
) : INotification;