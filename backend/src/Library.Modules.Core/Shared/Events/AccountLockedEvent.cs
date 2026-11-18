using MediatR;

namespace Library.Modules.Core.Shared.Events;

/// <summary>
/// Sự kiện phát ra khi tài khoản độc giả bị chuyển sang trạng thái Locked (Tạm khóa).
/// </summary>
public record AccountLockedEvent(
    int AccountId,
    string Reason,
    DateTime LockedAt
) : INotification;

