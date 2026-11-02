namespace Library.Modules.Core.Notifications.Data;

/// <summary>
/// In-app notification sent to an account (ThongBao).
/// Cross-context FK to Identity.Account stored as primitive Id.
/// </summary>
public class Notification
{
    public long Id { get; set; }

    // Cross-context FK → Identity.Account
    public int AccountId { get; set; }

    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public NotificationType NotificationType { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType { Reserve, Borrow, Return, Fine, System }
