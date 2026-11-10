using FluentValidation;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public sealed class ReportIncidentHandler : IRequestHandler<ReportIncidentRequest, ApiResponse<long>>
{
    private readonly CirculationDbContext _db;
    private readonly IValidator<ReportIncidentRequest> _validator;
    private readonly IMediator _mediator;

    public ReportIncidentHandler(CirculationDbContext db, IValidator<ReportIncidentRequest> validator, IMediator mediator)
    {
        _db = db;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(ReportIncidentRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<long>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var detail = await _db.LoanSlipDetails
            .Include(d => d.LoanSlip)
            .FirstOrDefaultAsync(d => d.Id == request.LoanSlipDetailId, ct);
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

        _db.Incidents.Add(incident);
        
        if (request.IncidentType == IncidentType.Lost)
            detail.Status = LoanDetailStatus.Lost;

        await _db.SaveChangesAsync(ct);
        
        await _mediator.Publish(new IncidentReportedEvent(
            incident.Id,
            incident.LoanSlipDetailId,
            detail.LoanSlip.AccountId,
            incident.LibrarianId,
            incident.IncidentType,
            incident.Severity,
            incident.CompensationAmount), ct);

        return ApiResponse<long>.Ok(incident.Id);
    }
}