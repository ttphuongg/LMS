using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public record ReportIncidentRequest(
    long LoanSlipDetailId,
    int LibrarianId,
    IncidentType IncidentType,
    IncidentSeverity Severity,
    string? Description,
    decimal CompensationAmount
) : IRequest<ApiResponse<long>>;
