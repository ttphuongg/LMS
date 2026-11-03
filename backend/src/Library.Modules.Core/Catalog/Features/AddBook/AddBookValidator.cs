using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.AddBook;

public sealed class AddBookValidator : AbstractValidator<AddBookRequest>
{
    public AddBookValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên sách không được để trống.")
            .MaximumLength(255).WithMessage("Tên sách tối đa 255 ký tự.");

        RuleFor(x => x.Isbn)
            .MaximumLength(20).WithMessage("ISBN tối đa 20 ký tự.")
            .Matches(@"^[\d\-X]+$").WithMessage("ISBN chỉ chứa số, dấu gạch ngang và ký tự X.")
            .When(x => !string.IsNullOrEmpty(x.Isbn));

        RuleFor(x => x.PublishedYear)
            .InclusiveBetween((short)1000, (short)2100)
            .WithMessage("Năm xuất bản phải từ 1000 đến 2100.")
            .When(x => x.PublishedYear.HasValue);

        RuleFor(x => x.Publisher)
            .MaximumLength(200).WithMessage("Nhà xuất bản tối đa 200 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Publisher));

        RuleFor(x => x.Language)
            .MaximumLength(50).WithMessage("Ngôn ngữ tối đa 50 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Language));

        RuleFor(x => x.PageCount)
            .GreaterThan(0).WithMessage("Số trang phải lớn hơn 0.")
            .When(x => x.PageCount.HasValue);

        RuleFor(x => x.BookValue)
            .GreaterThanOrEqualTo(0).WithMessage("Giá trị sách không được âm.")
            .When(x => x.BookValue.HasValue);

        RuleFor(x => x.CoverImageUrl)
            .MaximumLength(500).WithMessage("URL ảnh bìa tối đa 500 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.CoverImageUrl));

        RuleFor(x => x.AuthorIds)
            .NotNull().WithMessage("Danh sách tác giả không được null.");

        RuleFor(x => x.CategoryIds)
            .NotNull().WithMessage("Danh sách thể loại không được null.");
    }
}
