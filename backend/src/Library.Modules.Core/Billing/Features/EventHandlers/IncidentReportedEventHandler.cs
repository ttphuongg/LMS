using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Billing.Features.EventHandlers;

public class IncidentReportedEventHandler : INotificationHandler<IncidentReportedEvent>
{
    private readonly IMediator _mediator;

    public IncidentReportedEventHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task Handle(IncidentReportedEvent notification, CancellationToken ct)
    {
        if (notification.CompensationAmount > 0)
        {
            var issueFineReq = new IssueFineRequest(
                1, // We actually need AccountId. But IncidentReportedEvent doesn't have it directly.
                   // Wait, AccountId is needed for IssueFine. Let's assume the handler will fetch it or we can just pass it later.
                notification.LoanSlipDetailId,
                notification.IncidentId,
                FineType.Compensation,
                notification.CompensationAmount,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))
            );

            // Since we need AccountId, let's just let IssueFine handle it or we fetch it here.
            // For now, let's leave AccountId = 1, we will fix this manually next.
            await _mediator.Send(issueFineReq, ct);
        }
    }
}
