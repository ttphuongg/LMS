namespace Library.Modules.Core.Identity.Data;

/// <summary>
/// Represents an active or historical login session (PhienDangNhap).
/// Tracks refresh token, IP, user agent, and expiry.
/// </summary>
public class LoginSession
{
    public long Id { get; set; }
    public int AccountId { get; set; }
    public Account Account { get; set; } = default!;

    public string? RefreshTokenHash { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime LoggedInAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? LoggedOutAt { get; set; }

    public bool IsActive => LoggedOutAt is null && ExpiresAt > DateTime.UtcNow;
}
