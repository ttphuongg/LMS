using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.ReportIncident;

public class ReportIncidentValidator : AbstractValidator<ReportIncidentRequest>
{
    public ReportIncidentValidator()
    {
        RuleFor(x => x.LoanSlipDetailId).GreaterThan(0);
        RuleFor(x => x.LibrarianId).GreaterThan(0);
        RuleFor(x => x.IncidentType).IsInEnum();
        RuleFor(x => x.Severity).IsInEnum();
        RuleFor(x => x.CompensationAmount).GreaterThanOrEqualTo(0);
    }
}
