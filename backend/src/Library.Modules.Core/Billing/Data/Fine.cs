namespace Library.Modules.Core.Billing.Data;

/// <summary>
/// A monetary fine imposed on an account (KhoanPhat).
/// Can originate from overdue return or an Incident (damage/loss).
/// Cross-context FKs are primitive IDs.
/// </summary>
public class Fine
{
    public long Id { get; set; }

    // Cross-context FK → Identity.Account
    public int AccountId { get; set; }

    // Cross-context FK → Circulation.LoanSlipDetail (nullable)
    public long? LoanSlipDetailId { get; set; }

    // Cross-context FK → Circulation.Incident (nullable)
    public long? IncidentId { get; set; }

    public FineType FineType { get; set; }
    public decimal Amount { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateOnly? PaymentDueDate { get; set; }
    public FineStatus Status { get; set; } = FineStatus.Unpaid;
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }

    // Navigation within Billing context
    public ICollection<FinePayment> Payments { get; set; } = [];
}

public enum FineType { Overdue, Compensation, Other }
public enum FineStatus { Unpaid, PartiallyPaid, Paid, Cancelled }
