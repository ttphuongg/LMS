using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.ReserveBook;

public class ReserveBookValidator : AbstractValidator<ReserveBookRequest>
{
    public ReserveBookValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("AccountId không hợp lệ.");
        RuleFor(x => x.BookId).GreaterThan(0).WithMessage("BookId không hợp lệ.");
    }
}
