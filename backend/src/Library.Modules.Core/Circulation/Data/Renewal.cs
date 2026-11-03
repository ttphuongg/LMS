namespace Library.Modules.Core.Circulation.Data;

/// <summary>
/// Renewal request for a specific LoanSlipDetail (GiaHan).
/// Tracks each renewal number, old/new due dates, and librarian approval.
/// </summary>
public class Renewal
{
    public long Id { get; set; }

    public long LoanSlipDetailId { get; set; }
    public LoanSlipDetail LoanSlipDetail { get; set; } = default!;

    public byte RenewalNumber { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateOnly OldDueDate { get; set; }
    public DateOnly NewDueDate { get; set; }

    // Cross-context FK → Identity.Account (librarian who approved/rejected)
    public int? LibrarianId { get; set; }

    public RenewalStatus Status { get; set; } = RenewalStatus.Pending;
    public string? Reason { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public enum RenewalStatus { Pending, Approved, Rejected, Cancelled }
