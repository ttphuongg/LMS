using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.SearchBook;

public sealed class SearchBookValidator : AbstractValidator<SearchBookRequest>
{
    public SearchBookValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải >= 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Kích thước trang phải từ 1 đến 100.");

        RuleFor(x => x.PublishedYear)
            .InclusiveBetween((short)1000, (short)2100)
            .WithMessage("Năm xuất bản phải từ 1000 đến 2100.")
            .When(x => x.PublishedYear.HasValue);
    }
}
