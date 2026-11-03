using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.ManageCategories;

public class AddCategoryValidator : AbstractValidator<AddCategoryRequest>
{
    public AddCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên th? lo?i không ðý?c ð? tr?ng.");
    }
}
