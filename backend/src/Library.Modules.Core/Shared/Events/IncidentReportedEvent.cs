using Library.Modules.Core.Circulation.Contracts;
using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record IncidentReportedEvent(
    long IncidentId,
    long LoanSlipDetailId,
    int AccountId,
    int? LibrarianId,
    IncidentType IncidentType,
    IncidentSeverity Severity,
    decimal CompensationAmount
) : INotification;
