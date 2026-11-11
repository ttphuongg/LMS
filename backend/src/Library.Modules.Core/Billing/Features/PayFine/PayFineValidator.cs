using FluentValidation;

namespace Library.Modules.Core.Billing.Features.PayFine;

public class PayFineValidator : AbstractValidator<PayFineRequest>
{
    public PayFineValidator()
    {
        RuleFor(x => x.FineId).GreaterThan(0);
        RuleFor(x => x.PaymentMethod).IsInEnum();
        RuleFor(x => x.Notes).MaximumLength(500);
    }
}
