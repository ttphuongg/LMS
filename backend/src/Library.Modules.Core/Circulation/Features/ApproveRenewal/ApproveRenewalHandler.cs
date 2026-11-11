using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public sealed class ApproveRenewalHandler : IRequestHandler<ApproveRenewalRequest, ApiResponse<bool>>
{
    private readonly CirculationDbContext _db;
    private readonly IValidator<ApproveRenewalRequest> _validator;

    public ApproveRenewalHandler(CirculationDbContext db, IValidator<ApproveRenewalRequest> validator)
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
                    .ThenInclude(ls => ls.Details)
            .FirstOrDefaultAsync(r => r.Id == request.RenewalId, ct);

        if (renewal == null) return ApiResponse<bool>.Fail("Yêu cầu gia hạn không tồn tại.");
        if (renewal.Status != RenewalStatus.Pending) return ApiResponse<bool>.Fail("Yêu cầu này đã được xử lý.");

        renewal.Status = request.Status;
        renewal.LibrarianId = request.LibrarianId;
        renewal.ResolvedAt = DateTime.UtcNow;
        
        if (request.Status == RenewalStatus.Rejected)
            renewal.Reason = request.Reason;

        if (request.Status == RenewalStatus.Approved)
        {
            if (renewal.LoanSlipDetail != null)
            {
                // Cập nhật hạn trả cho bản sao sách cụ thể
                renewal.LoanSlipDetail.DueDate = renewal.NewDueDate;
                renewal.LoanSlipDetail.UpdatedAt = DateTime.UtcNow;
                renewal.LoanSlipDetail.UpdatedBy = request.LibrarianId;

                var slip = renewal.LoanSlipDetail.LoanSlip;
                if (slip != null)
                {
                    // Cập nhật DueDate của phiếu mượn nếu hạn mới xa hơn
                    if (renewal.NewDueDate > slip.DueDate)
                        slip.DueDate = renewal.NewDueDate;

                    var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

                    // Chỉ chuyển trạng thái phiếu về Borrowing nếu KHÔNG còn cuốn sách nào trong phiếu bị quá hạn
                    var stillHasOverdue = slip.Details.Any(d =>
                        d.Status == LoanDetailStatus.Borrowing &&
                        (d.DueDate ?? slip.DueDate) < today);

                    if (!stillHasOverdue && slip.Status == LoanStatus.Overdue)
                    {
                        slip.Status = LoanStatus.Borrowing;
                        slip.UpdatedAt = DateTime.UtcNow;
                        slip.UpdatedBy = request.LibrarianId;
                    }
                }
            }
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
