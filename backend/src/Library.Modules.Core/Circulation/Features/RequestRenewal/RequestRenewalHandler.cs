using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.RequestRenewal;

public sealed class RequestRenewalHandler : IRequestHandler<RequestRenewalRequest, ApiResponse<long>>
{
    private readonly CirculationDbContext _db;
    private readonly IValidator<RequestRenewalRequest> _validator;
    private const int MaxRenewals = 3; // số lần gia hạn tối đa

    public RequestRenewalHandler(CirculationDbContext db, IValidator<RequestRenewalRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<long>> Handle(RequestRenewalRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<long>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var detail = await _db.LoanSlipDetails
            .Include(d => d.LoanSlip)
            .Include(d => d.Renewals)
            .FirstOrDefaultAsync(d => d.Id == request.LoanSlipDetailId, ct);

        if (detail == null)
            return ApiResponse<long>.Fail("Chi tiết phiếu mượn không tồn tại.");

        if (detail.LoanSlip.AccountId != request.AccountId)
            return ApiResponse<long>.Fail("Bạn không có quyền gia hạn sách này.");

        if (detail.Status != LoanDetailStatus.Borrowing)
            return ApiResponse<long>.Fail("Sách này không ở trạng thái đang mượn.");

        // Kiểm tra đã có yêu cầu Pending chưa
        var hasPending = detail.Renewals.Any(r => r.Status == RenewalStatus.Pending);
        if (hasPending)
            return ApiResponse<long>.Fail("Đã có yêu cầu gia hạn đang chờ xử lý.");

        // Kiểm tra số lần gia hạn tối đa dựa trên số lần đã được duyệt
        var approvedCount = detail.Renewals.Count(r => r.Status == RenewalStatus.Approved);
        if (approvedCount >= MaxRenewals)
            return ApiResponse<long>.Fail($"Đã đạt giới hạn {MaxRenewals} lần gia hạn.");

        // Tính ngày hết hạn hiện tại của bản sao sách
        var currentDueDate = detail.GetEffectiveDueDate();
        if (currentDueDate == default)
            currentDueDate = detail.LoanSlip.DueDate;

        // NewDueDate phải lớn hơn DueDate hiện tại của cuốn sách
        if (request.NewDueDate <= currentDueDate)
            return ApiResponse<long>.Fail("Ngày gia hạn phải lớn hơn ngày hết hạn hiện tại của sách.");

        var renewal = new Renewal
        {
            LoanSlipDetailId = request.LoanSlipDetailId,
            RenewalNumber = (byte)(approvedCount + 1),
            OldDueDate = currentDueDate,
            NewDueDate = request.NewDueDate,
            Reason = request.Reason,
            Status = RenewalStatus.Pending
        };

        _db.Renewals.Add(renewal);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(renewal.Id);
    }
}
