using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public class ApproveRenewalValidator : AbstractValidator<ApproveRenewalRequest>
{
    public ApproveRenewalValidator()
    {
        RuleFor(x => x.RenewalId).GreaterThan(0);
        RuleFor(x => x.LibrarianId).GreaterThan(0);
        RuleFor(x => x.Status).IsInEnum();
    }
}
