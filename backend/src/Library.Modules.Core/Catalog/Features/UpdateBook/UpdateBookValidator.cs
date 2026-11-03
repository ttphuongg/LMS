using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.UpdateBook;

public class UpdateBookValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookValidator()
    {
        RuleFor(x => x.BookId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().WithMessage("Tiêu đề không được để trống.");
        RuleFor(x => x.PageCount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BookValue).GreaterThanOrEqualTo(0);
    }
}
