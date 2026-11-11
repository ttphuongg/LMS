using FluentValidation;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.PayFine;

public sealed class PayFineHandler : IRequestHandler<PayFineRequest, ApiResponse<bool>>
{
    private readonly BillingDbContext _db;
    private readonly IValidator<PayFineRequest> _validator;

    public PayFineHandler(BillingDbContext db, IValidator<PayFineRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(PayFineRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var fine = await _db.Fines
            .FirstOrDefaultAsync(f => f.Id == request.FineId, ct);

        if (fine == null) return ApiResponse<bool>.Fail("Phiếu phạt không tồn tại.");
        if (fine.Status != FineStatus.Unpaid)
            return ApiResponse<bool>.Fail("Phiếu phạt đã được thanh toán hoặc hủy.");

        // Thanh toán trực tiếp trọn gói 1 lần: quyết toán đủ 100% số tiền phạt
        var payment = new FinePayment
        {
            FineId = fine.Id,
            LibrarianId = request.LibrarianId,
            Amount = fine.Amount,
            PaymentMethod = request.PaymentMethod,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? "Thanh toán trực tiếp tại quầy" : request.Notes.Trim(),
            PaidAt = DateTime.UtcNow
        };

        _db.FinePayments.Add(payment);

        fine.Status = FineStatus.Paid;
        fine.UpdatedAt = DateTime.UtcNow;
        fine.UpdatedBy = request.LibrarianId;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
