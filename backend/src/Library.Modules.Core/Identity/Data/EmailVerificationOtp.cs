namespace Library.Modules.Core.Identity.Data;

public class EmailVerificationOtp
{
    public long Id { get; set; }
    public int AccountId { get; set; }
    public string Email { get; set; } = default!;
    public string OtpHash { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
    public int FailedAttempts { get; set; } = 0;

    public bool IsUsed => UsedAt != null;

    // Navigation (within Identity context only)
    public Account Account { get; set; } = default!;
}
