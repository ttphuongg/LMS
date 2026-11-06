using FluentValidation;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Billing.Features.IssueFine;

public sealed class IssueFineHandler : IRequestHandler<IssueFineRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<IssueFineRequest> _validator;
    private readonly IMediator _mediator;

    public IssueFineHandler(AppDbContext db, IValidator<IssueFineRequest> validator, IMediator mediator)
    {
        _db = db;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(IssueFineRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<long>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var fine = new Fine
        {
            AccountId = request.AccountId,
            LoanSlipDetailId = request.LoanSlipDetailId,
            IncidentId = request.IncidentId,
            FineType = request.FineType,
            Amount = request.Amount,
            PaymentDueDate = request.PaymentDueDate,
            IssuedAt = DateTime.UtcNow,
            Status = request.Amount == 0 ? FineStatus.Paid : FineStatus.Unpaid
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
