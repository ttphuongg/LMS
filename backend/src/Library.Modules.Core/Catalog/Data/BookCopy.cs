namespace Library.Modules.Core.Catalog.Data;

/// <summary>
/// Represents a single physical copy of a book (BanSaoSach).
/// Each copy has its own barcode, shelf location, condition and availability status.
/// </summary>
public class BookCopy
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public Book Book { get; set; } = default!;

    public string Barcode { get; set; } = default!;

    /// <summary>FK → Locations. Nullable: bản sao chưa được xếp kệ.</summary>
    public int? LocationId { get; set; }
    public Location? Location { get; set; }

    public DateOnly AcquiredDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

    public CopyCondition Condition { get; set; } = CopyCondition.Good;
    public CopyStatus Status { get; set; } = CopyStatus.Available;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public byte[] RowVersion { get; set; } = default!;
}

/// <summary>TOT → Good | HONG_NHE → MinorDamage | HONG_NANG → MajorDamage | MAT → Lost</summary>
public enum CopyCondition { Good, MinorDamage, MajorDamage, Lost }

/// <summary>Physical availability status of a single copy.</summary>
public enum CopyStatus { Available, Reserved, Borrowed, Maintenance, Lost, Inactive }
