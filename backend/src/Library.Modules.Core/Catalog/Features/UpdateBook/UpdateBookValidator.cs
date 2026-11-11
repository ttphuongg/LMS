using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.UpdateBook;

public class UpdateBookValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookValidator()
    {
        RuleFor(x => x.BookId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().WithMessage("Tiêu đề không được để trống.");
        RuleFor(x => x.PageCount).GreaterThan(0).When(x => x.PageCount.HasValue).WithMessage("Số trang phải lớn hơn 0.");
        RuleFor(x => x.BookValue).GreaterThan(0).When(x => x.BookValue.HasValue).WithMessage("Giá trị sách phải lớn hơn 0.");
        RuleFor(x => x.PublishedYear)
            .InclusiveBetween(1000, 2100)
            .When(x => x.PublishedYear.HasValue)
            .WithMessage("Năm xuất bản phải trong khoảng 1000–2100.");
    }
}
