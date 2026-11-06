using FluentValidation;

namespace Library.Modules.Core.Billing.Features.IssueFine;

public class IssueFineValidator : AbstractValidator<IssueFineRequest>
{
    public IssueFineValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FineType).IsInEnum();
    }
}
