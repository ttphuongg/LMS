using Library.Modules.Core.Circulation.Data;
using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record IncidentReportedEvent(
    long IncidentId,
    long LoanSlipDetailId,
    int? LibrarianId,
    IncidentType IncidentType,
    IncidentSeverity Severity,
    decimal? CompensationAmount
) : INotification;

