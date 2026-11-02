namespace Library.Modules.Core.Circulation.Data;

/// <summary>
/// Reader's reservation for a book title (DatTruoc).
/// May or may not be assigned to a specific BookCopy.
/// Cross-context FKs are stored as primitive IDs — no navigation to Identity/Catalog.
/// </summary>
public class Reservation
{
    public long Id { get; set; }

    // Cross-context FK → Identity.Account
    public int AccountId { get; set; }

    // Cross-context FK → Catalog.Book
    public int BookId { get; set; }

    // Cross-context FK → Catalog.BookCopy (assigned when copy becomes available)
    public int? BookCopyId { get; set; }

    public DateTime ReservedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Waiting;
    public byte[] RowVersion { get; set; } = default!;
}

public enum ReservationStatus { Waiting, Ready, Completed, Cancelled, Expired }
