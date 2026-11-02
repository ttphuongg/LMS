namespace Library.Modules.Core.Billing.Data;

/// <summary>
/// Records a payment towards a fine (ThanhToanPhat).
/// Supports partial payments (PARTIALLY_PAID status on Fine).
/// </summary>
public class FinePayment
{
    public long Id { get; set; }

    public long FineId { get; set; }
    public Fine Fine { get; set; } = default!;

    // Cross-context FK → Identity.Account (librarian who collected payment)
    public int? LibrarianId { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}

public enum PaymentMethod { Cash, BankTransfer, Other }
