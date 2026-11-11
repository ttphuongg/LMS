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

    /// <summary>
    /// Hạn trả riêng của bản sao sách này. Mặc định nhận từ LoanSlip.DueDate khi mượn,
    /// và được cập nhật khi yêu cầu gia hạn (Renewal) cho bản sao này được duyệt.
    /// </summary>
    public DateOnly? DueDate { get; set; }

    public DateOnly? ActualReturnDate { get; set; }
    public string? Notes { get; set; }

    public LoanDetailStatus Status { get; set; } = LoanDetailStatus.Borrowing;

    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }

    // Navigation within Circulation context
    public ICollection<Renewal> Renewals { get; set; } = [];
    public ICollection<Incident> Incidents { get; set; } = [];

    /// <summary>
    /// Tính ngày hết hạn thực tế của bản sao sách:
    /// Ưu tiên DueDate của dòng chi tiết -> Renewal mới nhất đã được duyệt -> DueDate của phiếu mượn.
    /// </summary>
    public DateOnly GetEffectiveDueDate()
    {
        if (DueDate.HasValue) return DueDate.Value;

        var latestApproved = Renewals
            .Where(r => r.Status == RenewalStatus.Approved)
            .OrderByDescending(r => r.NewDueDate)
            .FirstOrDefault();

        if (latestApproved != null) return latestApproved.NewDueDate;

        return LoanSlip?.DueDate ?? default;
    }
}

public enum LoanDetailStatus { Borrowing, Returned, Lost, Damaged }
