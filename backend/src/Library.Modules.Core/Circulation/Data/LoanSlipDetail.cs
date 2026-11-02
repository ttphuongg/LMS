namespace Library.Modules.Core.Circulation.Data;

/// <summary>
/// Detail line of a loan slip — each row is one physical BookCopy being borrowed (ChiTietPhieuMuon).
/// </summary>
public class LoanSlipDetail
{
    public long Id { get; set; }

    public long LoanSlipId { get; set; }
    public LoanSlip LoanSlip { get; set; } = default!;

    // Cross-context FK → Catalog.BookCopy
    public int BookCopyId { get; set; }

    public DateOnly? ActualReturnDate { get; set; }
    public string? Notes { get; set; }

    public LoanDetailStatus Status { get; set; } = LoanDetailStatus.Borrowing;

    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }

    // Navigation within Circulation context
    public ICollection<Renewal> Renewals { get; set; } = [];
    public ICollection<Incident> Incidents { get; set; } = [];
}

public enum LoanDetailStatus { Borrowing, Returned, Lost, Damaged }
