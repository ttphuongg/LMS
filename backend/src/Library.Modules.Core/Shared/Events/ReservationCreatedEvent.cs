using MediatR;

namespace Library.Modules.Core.Shared.Events;

/// <summary>
/// Sự kiện phát ra khi độc giả hoàn tất việc đặt trước một cuốn sách.
/// IsReady = true: Sách đã có sẵn bản sao tại quầy, có thể đến nhận ngay trong cửa sổ giữ sách.
/// IsReady = false: Không có bản sao sẵn có, độc giả được đưa vào hàng chờ.
/// </summary>
public record ReservationCreatedEvent(
    long ReservationId,
    int AccountId,
    int BookId,
    bool IsReady,
    DateTime? ExpiresAt
) : INotification;

