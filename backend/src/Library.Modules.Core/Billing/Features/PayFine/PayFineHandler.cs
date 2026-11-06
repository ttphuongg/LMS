using FluentValidation;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.PayFine;

public sealed class PayFineHandler : IRequestHandler<PayFineRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<PayFineRequest> _validator;

    public PayFineHandler(AppDbContext db, IValidator<PayFineRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(PayFineRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<bool>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var fine = await _db.Set<Fine>()
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.Id == request.FineId, ct);

        if (fine == null) return ApiResponse<bool>.Fail("Phi?u ph?t không t?n t?i.");
        if (fine.Status == FineStatus.Paid || fine.Status == FineStatus.Cancelled)
            return ApiResponse<bool>.Fail("Phi?u ph?t ð? ðý?c thanh toán ho?c h?y.");

        var totalPaid = fine.Payments.Sum(p => p.Amount) + request.Amount;
        if (totalPaid > fine.Amount)
            return ApiResponse<bool>.Fail("S? ti?n thanh toán vý?t quá s? ti?n ph?t.");

        var payment = new FinePayment
        {
            FineId = request.FineId,
            LibrarianId = request.LibrarianId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            PaidAt = DateTime.UtcNow
        };

        _db.Set<FinePayment>().Add(payment);

        fine.Status = totalPaid == fine.Amount ? FineStatus.Paid : FineStatus.PartiallyPaid;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
