using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public sealed class ReportIncidentHandler : IRequestHandler<ReportIncidentRequest, ApiResponse<long>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IValidator<ReportIncidentRequest> _validator;
    private readonly IMediator _mediator;

    public ReportIncidentHandler(CirculationDbContext db, ISender sender, IValidator<ReportIncidentRequest> validator, IMediator mediator)
    {
        _db = db;
        _sender = sender;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<long>> Handle(ReportIncidentRequest request, CancellationToken ct)
    {
        var val = await _validator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<long>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var detail = await _db.LoanSlipDetails.Include(d => d.LoanSlip)
            .FirstOrDefaultAsync(d => d.Id == request.LoanSlipDetailId, ct);
        if (detail == null) return ApiResponse<long>.Fail("Chi tiết phiếu mượn không tồn tại.");

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

        var newStatus = request.IncidentType == IncidentType.Lost ? CopyStatus.Lost : CopyStatus.Maintenance;
        var newCondition = request.IncidentType == IncidentType.Lost
            ? CopyCondition.Lost
            : (request.Severity == IncidentSeverity.Minor ? CopyCondition.MinorDamage : CopyCondition.MajorDamage);

        await _sender.Send(new SetCopyStatusCommand(detail.BookCopyId, null, newStatus, newCondition), ct);

        if (request.IncidentType == IncidentType.Lost)
        {
            detail.Status = LoanDetailStatus.Lost;

            var slip = await _db.LoanSlips.Include(l => l.Details)
                .FirstOrDefaultAsync(l => l.Id == detail.LoanSlipId, ct);
            if (slip != null && slip.Details.All(d => d.Status != LoanDetailStatus.Borrowing))
            {
                slip.Status = LoanStatus.Returned;
                slip.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync(ct);

        await _mediator.Publish(new IncidentReportedEvent(
            incident.Id, incident.LoanSlipDetailId, detail.LoanSlip.AccountId, incident.LibrarianId, incident.IncidentType, incident.Severity, incident.CompensationAmount), ct);

        return ApiResponse<long>.Ok(incident.Id);
    }
}