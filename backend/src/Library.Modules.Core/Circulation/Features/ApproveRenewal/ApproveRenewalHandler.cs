using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public sealed class ApproveRenewalHandler : IRequestHandler<ApproveRenewalRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ApproveRenewalRequest> _validator;

    public ApproveRenewalHandler(AppDbContext db, IValidator<ApproveRenewalRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(ApproveRenewalRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var renewal = await _db.Set<Renewal>()
            .Include(r => r.LoanSlipDetail)
                .ThenInclude(d => d.LoanSlip)
            .FirstOrDefaultAsync(r => r.Id == request.RenewalId, ct);

        if (renewal == null) return ApiResponse<bool>.Fail("Yêu cầu gia hạn không tồn tại.");
        if (renewal.Status != RenewalStatus.Pending) return ApiResponse<bool>.Fail("Yêu cầu này đã được xử lý.");

        renewal.Status = request.Status;
        renewal.LibrarianId = request.LibrarianId;
        
        if (request.Status == RenewalStatus.Rejected)
            renewal.Reason = request.Reason;

        if (request.Status == RenewalStatus.Approved)
        {
            if (renewal.LoanSlipDetail?.LoanSlip != null)
            {
                renewal.LoanSlipDetail.LoanSlip.DueDate = renewal.NewDueDate;
            }
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}