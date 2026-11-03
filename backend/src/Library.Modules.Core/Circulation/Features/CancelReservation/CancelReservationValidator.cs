using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public class CancelReservationValidator : AbstractValidator<CancelReservationRequest>
{
    public CancelReservationValidator()
    {
        RuleFor(x => x.ReservationId).GreaterThan(0);
        RuleFor(x => x.AccountId).GreaterThan(0);
    }
}
