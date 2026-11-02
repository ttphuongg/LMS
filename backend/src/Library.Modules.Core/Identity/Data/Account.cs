using System.Text.Json.Serialization;

namespace Library.Modules.Core.Identity.Data;

public class Account
{
    public int Id { get; set; }
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }

    public AccountRole Role { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public byte[] RowVersion { get; set; } = default!;

    public DateTime? DeactivatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation (within Identity context only)
    public ICollection<LoginSession> LoginSessions { get; set; } = [];
}

/// <summary>DOC_GIA → Reader | THU_THU → Librarian | QUAN_TRI_VIEN → Admin</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountRole { Reader, Librarian, Admin }

/// <summary>ACTIVE → Active | LOCKED → Locked | INACTIVE → Inactive</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountStatus { Active, Locked, Inactive }
