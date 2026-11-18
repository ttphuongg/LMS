using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.GetCirculationEligibility;

public sealed class GetCirculationEligibilityHandler 
    : IRequestHandler<GetCirculationEligibilityRequest, ApiResponse<CirculationEligibilityDto>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;

    public GetCirculationEligibilityHandler(CirculationDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public async Task<ApiResponse<CirculationEligibilityDto>> Handle(
        GetCirculationEligibilityRequest request, 
        CancellationToken ct)
    {
        // 1. Kiểm tra tài khoản có bị khóa hoàn toàn không
        var account = await _sender.Send(new GetAccountSummaryQuery(request.AccountId), ct);
        if (account == null)
        {
            return ApiResponse<CirculationEligibilityDto>.Fail("Tài khoản không tồn tại.");
        }

        if (!account.IsActive || account.Status == "Locked" || account.Status == "Inactive")
        {
            return ApiResponse<CirculationEligibilityDto>.Ok(new CirculationEligibilityDto(
                IsEligible: false,
                RestrictionReason: "Tài khoản hiện đang bị khóa hoàn toàn bởi quản trị viên.",
                HasOverdueLoans: false,
                OverdueLoansCount: 0,
                HasOverdueFines: false,
                OverdueFinesCount: 0,
                TotalOverdueFineAmount: 0
            ));
        }

        var today = VietnamTime.Today();

        // 2. Kiểm tra sách mượn quá hạn
        var overdueLoans = await _db.LoanSlipDetails
            .Where(d => d.LoanSlip.AccountId == request.AccountId &&
                        d.Status == LoanDetailStatus.Borrowing &&
                        (d.DueDate != null ? d.DueDate < today : d.LoanSlip.DueDate < today))
            .ToListAsync(ct);

        var hasOverdueLoans = overdueLoans.Count > 0;

        // 3. Kiểm tra hóa đơn phạt quá hạn thanh toán qua Billing Module (ân hạn 2 ngày)
        var fineCheck = await _sender.Send(new CheckCirculationFineRestrictionQuery(request.AccountId, GraceDays: 2), ct);

        var isEligible = !hasOverdueLoans && !fineCheck.IsRestricted;
        string? reason = null;

        if (!isEligible)
        {
            var reasons = new List<string>();
            if (hasOverdueLoans)
            {
                reasons.Add($"Bạn đang có {overdueLoans.Count} cuốn sách quá hạn chưa hoàn trả.");
            }
            if (fineCheck.IsRestricted)
            {
                reasons.Add(fineCheck.Reason ?? "Có khoản phạt quá hạn thanh toán.");
            }
            reason = string.Join(" ", reasons);
        }

        return ApiResponse<CirculationEligibilityDto>.Ok(new CirculationEligibilityDto(
            IsEligible: isEligible,
            RestrictionReason: reason,
            HasOverdueLoans: hasOverdueLoans,
            OverdueLoansCount: overdueLoans.Count,
            HasOverdueFines: fineCheck.IsRestricted,
            OverdueFinesCount: fineCheck.OverdueFinesCount,
            TotalOverdueFineAmount: fineCheck.TotalOverdueAmount
        ));
    }
}

