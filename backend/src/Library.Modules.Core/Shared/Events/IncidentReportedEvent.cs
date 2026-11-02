using MediatR;
using Library.Modules.Core.Circulation.Data;

namespace Library.Modules.Core.Shared.Events;

public record IncidentReportedEvent(
    long IncidentId,
    long LoanSlipDetailId,
    int? LibrarianId,
    IncidentType IncidentType,
    IncidentSeverity Severity,
    decimal CompensationAmount
) : INotification;
