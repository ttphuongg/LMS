using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.CheckCirculationFineRestriction;

public sealed class CheckCirculationFineRestrictionHandler 
    : IRequestHandler<CheckCirculationFineRestrictionQuery, CirculationFineRestrictionResult>
{
    private readonly BillingDbContext _db;

    public CheckCirculationFineRestrictionHandler(BillingDbContext db)
    {
        _db = db;
    }

    public async Task<CirculationFineRestrictionResult> Handle(
        CheckCirculationFineRestrictionQuery request, 
        CancellationToken ct)
    {
        var today = VietnamTime.Today();

        // Lấy tất cả các khoản phạt chưa thanh toán hoặc thanh toán 1 phần của tài khoản
        var unpaidFines = await _db.Fines
            .Where(f => f.AccountId == request.AccountId && 
                       (f.Status == FineStatus.Unpaid || f.Status == FineStatus.PartiallyPaid))
            .ToListAsync(ct);

        if (unpaidFines.Count == 0)
        {
            return new CirculationFineRestrictionResult(false, null, 0, 0);
        }

        // Lọc các khoản phạt đã quá hạn thanh toán vượt qua số ngày ân hạn (GraceDays)
        // Nếu không có PaymentDueDate thì mặc định 7 ngày kể từ ngày ban hành
        var overdueFines = unpaidFines.Where(f =>
        {
            var effectiveDueDate = f.PaymentDueDate ?? DateOnly.FromDateTime(f.IssuedAt).AddDays(7);
            return today.DayNumber > (effectiveDueDate.DayNumber + request.GraceDays);
        }).ToList();

        if (overdueFines.Count == 0)
        {
            // Các khoản phạt chưa quá hạn thanh toán (hoặc vẫn đang trong thời gian ân hạn 1-3 ngày)
            // -> Người dùng VẪN ĐƯỢC mượn và đặt trước sách bình thường
            return new CirculationFineRestrictionResult(false, null, 0, 0);
        }

        var maxDaysOverdue = overdueFines.Max(f => 
            today.DayNumber - (f.PaymentDueDate ?? DateOnly.FromDateTime(f.IssuedAt).AddDays(7)).DayNumber);
        var totalOverdueAmount = overdueFines.Sum(f => f.Amount);

        var reason = $"Bạn đang có {overdueFines.Count} khoản phạt đã quá hạn thanh toán {maxDaysOverdue} ngày " +
                     $"(tổng nợ quá hạn: {totalOverdueAmount:N0} đ). " +
                     $"Chức năng mượn và đặt trước sách tạm thời bị khóa. " +
                     $"Vui lòng thanh toán tại mục 'Phiếu phạt của tôi' để mở khóa chức năng.";

        return new CirculationFineRestrictionResult(
            IsRestricted: true,
            Reason: reason,
            OverdueFinesCount: overdueFines.Count,
            TotalOverdueAmount: totalOverdueAmount
        );
    }
}

