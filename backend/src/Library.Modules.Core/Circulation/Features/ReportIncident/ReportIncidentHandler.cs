using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public sealed class ReportIncidentHandler : IRequestHandler<ReportIncidentRequest, ApiResponse<long>>
{
    private readonly AppDbContext _db;
    private readonly IValidator<ReportIncidentRequest> _validator;
    private readonly IMediator _mediator;

    public ReportIncidentHandler(AppDbContext db, IValidator<ReportIncidentRequest> validator, IMediator mediator)
    {
        _db = db;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(ReportIncidentRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<long>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var detail = await _db.Set<LoanSlipDetail>().FindAsync(new object[] { request.LoanSlipDetailId }, ct);
        if (detail == null) return ApiResponse<long>.Fail("LoanSlipDetail not found.");

        var incident = new Incident
        {
            LoanSlipDetailId = request.LoanSlipDetailId,
            LibrarianId = request.LibrarianId,
            IncidentType = request.IncidentType,
            Severity = request.Severity,
            Description = request.Description,
            CompensationAmount = request.CompensationAmount,
            RecordedAt = DateTime.UtcNow,
            Status = IncidentStatus.Recorded
        };

        _db.Set<Incident>().Add(incident);
        
        if (request.IncidentType == IncidentType.Lost)
            detail.Status = LoanDetailStatus.Lost;

        await _db.SaveChangesAsync(ct);
        
        await _mediator.Publish(new Library.Modules.Core.Shared.Events.IncidentReportedEvent(
            incident.Id, incident.LoanSlipDetailId, incident.LibrarianId, incident.IncidentType, incident.Severity, incident.CompensationAmount), ct);

        return ApiResponse<long>.Ok(incident.Id);
    }
}