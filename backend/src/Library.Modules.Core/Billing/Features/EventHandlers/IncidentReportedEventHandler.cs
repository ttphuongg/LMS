using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared.Events;
using MediatR;

namespace Library.Modules.Core.Billing.Features.EventHandlers;

public class IncidentReportedEventHandler : INotificationHandler<IncidentReportedEvent>
{
    private readonly ISender _sender;

    public IncidentReportedEventHandler(ISender sender)
    {
        _sender = sender;
    }

    public async Task Handle(IncidentReportedEvent notification, CancellationToken ct)
    {
        if (notification.CompensationAmount > 0)
        {
            var issueFineReq = new IssueFineRequest(
                notification.AccountId,
                notification.LoanSlipDetailId,
                notification.IncidentId,
                FineType.Compensation,
                notification.CompensationAmount.Value,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))
            );

            await _sender.Send(issueFineReq, ct);
        }
    }
}
