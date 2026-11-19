using FluentValidation;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Features.IssueFine;

public sealed class IssueFineHandler : IRequestHandler<IssueFineRequest, ApiResponse<long>>
{
    private readonly BillingDbContext _db;
    private readonly IValidator<IssueFineRequest> _validator;
    private readonly IMediator _mediator;

    public IssueFineHandler(BillingDbContext db, IValidator<IssueFineRequest> validator, IMediator mediator)
    {
        _db = db;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(IssueFineRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<long>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        // ── Chống tạo trùng phiếu phạt cho cùng một sự cố (Idempotency) ────────
        if (request.IncidentId.HasValue && request.IncidentId.Value > 0)
        {
            var existingFine = await _db.Fines
                .FirstOrDefaultAsync(f => f.IncidentId == request.IncidentId.Value, ct);
            if (existingFine != null)
            {
                return ApiResponse<long>.Ok(existingFine.Id);
            }
        }

        // ── Chống tạo trùng phiếu phạt quá hạn cho cùng một lượt mượn ─────────
        if (request.LoanSlipDetailId.HasValue && request.LoanSlipDetailId.Value > 0 && request.FineType == FineType.Overdue)
        {
            var existingOverdueFine = await _db.Fines
                .FirstOrDefaultAsync(f => f.LoanSlipDetailId == request.LoanSlipDetailId.Value && f.FineType == FineType.Overdue, ct);
            if (existingOverdueFine != null)
            {
                return ApiResponse<long>.Ok(existingOverdueFine.Id);
            }
        }

        var fine = new Fine
        {
            AccountId = request.AccountId,
            LoanSlipDetailId = request.LoanSlipDetailId,
            IncidentId = request.IncidentId,
            FineType = request.FineType,
            Amount = request.Amount,
            PaymentDueDate = request.PaymentDueDate,
            IssuedAt = DateTime.UtcNow,
            Status = FineStatus.Unpaid
        };

        _db.Set<Fine>().Add(fine);
        await _db.SaveChangesAsync(ct);

        if (fine.Amount > 0)
        {
            await _mediator.Publish(new FineIssuedEvent(fine.Id, fine.AccountId, fine.Amount, fine.FineType), ct);
        }

        return ApiResponse<long>.Ok(fine.Id);
    }
}
