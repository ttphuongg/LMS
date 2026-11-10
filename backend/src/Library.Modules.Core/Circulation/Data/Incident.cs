using Library.Modules.Core.Circulation.Contracts;

namespace Library.Modules.Core.Circulation.Data;

/// <summary>
/// Records a damage or loss incident on a specific LoanSlipDetail (SuCo).
/// Drives automatic Fine generation in the Billing context.
/// </summary>
public class Incident
{
    public long Id { get; set; }

    public long LoanSlipDetailId { get; set; }
    public LoanSlipDetail LoanSlipDetail { get; set; } = default!;

    // Cross-context FK → Identity.Account (librarian who recorded)
    public int? LibrarianId { get; set; }

    public IncidentType IncidentType { get; set; }
    public IncidentSeverity Severity { get; set; }
    public string? Description { get; set; }
    public decimal CompensationAmount { get; set; } = 0;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public IncidentStatus Status { get; set; } = IncidentStatus.Recorded;
    public DateTime? ResolvedAt { get; set; }
}
