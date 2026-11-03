using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.RequestRenewal;

public sealed class RequestRenewalHandler : IRequestHandler<RequestRenewalRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<RequestRenewalRequest> _validator;

    public RequestRenewalHandler(AppDbContext db, IValidator<RequestRenewalRequest> validator)
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

        var renewalCount = detail.Renewals.Count;
        var renewal = new Renewal
        {
            LoanSlipDetailId = request.LoanSlipDetailId,
            RenewalNumber = (byte)(renewalCount + 1),
            OldDueDate = detail.LoanSlip.DueDate,
            NewDueDate = request.NewDueDate,
            Reason = request.Reason,
            Status = RenewalStatus.Pending
        };

        _db.Renewals.Add(renewal);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<long>.Ok(renewal.Id);
    }
}
