using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.ManageAuthors;

public class AddAuthorValidator : AbstractValidator<AddAuthorRequest>
{
    public AddAuthorValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên tác gi? không ðý?c ð? tr?ng.");
    }
}
