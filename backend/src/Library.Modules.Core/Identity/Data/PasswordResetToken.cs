namespace Library.Modules.Core.Identity.Data;

public class PasswordResetToken
{
    public long Id { get; set; }
    public int AccountId { get; set; }
    public string TokenHash { get; set; } = default!;
    public string? OtpHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }

    public bool IsUsed => UsedAt != null;

    // Navigation (within Identity context only)
    public Account Account { get; set; } = default!;
}

