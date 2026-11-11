using FluentValidation;
using Library.Modules.Core.Circulation.Data;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public class ApproveRenewalValidator : AbstractValidator<ApproveRenewalRequest>
{
    public ApproveRenewalValidator()
    {
        RuleFor(x => x.RenewalId).GreaterThan(0);
        RuleFor(x => x.LibrarianId).GreaterThan(0);
        RuleFor(x => x.Status)
            .Must(s => s == RenewalStatus.Approved || s == RenewalStatus.Rejected)
            .WithMessage("Trạng thái chỉ được là Approved hoặc Rejected.");
    }
}