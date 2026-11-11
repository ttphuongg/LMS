using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.ManageCopies;

public sealed class AddCopyValidator : AbstractValidator<AddCopyRequest>
{
    public AddCopyValidator()
    {
        RuleFor(x => x.BookId)
            .GreaterThan(0).WithMessage("BookId không hợp lệ.");

        RuleFor(x => x.Barcode)
            .NotEmpty().WithMessage("Mã vạch không được để trống.")
            .MaximumLength(50).WithMessage("Mã vạch tối đa 50 ký tự.");

        RuleFor(x => x.LocationId)
            .GreaterThan(0).WithMessage("LocationId không hợp lệ.")
            .When(x => x.LocationId.HasValue);

        RuleFor(x => x.AcquiredDate)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("Ngày nhập sách không được sau ngày hiện tại.")
            .When(x => x.AcquiredDate.HasValue);
    }
}

public sealed class UpdateCopyLocationValidator : AbstractValidator<UpdateCopyLocationRequest>
{
    public UpdateCopyLocationValidator()
    {
        RuleFor(x => x.CopyId)
            .GreaterThan(0).WithMessage("CopyId không hợp lệ.");

        RuleFor(x => x.LocationId)
            .GreaterThan(0).WithMessage("LocationId không hợp lệ.")
            .When(x => x.LocationId.HasValue);
    }
}
