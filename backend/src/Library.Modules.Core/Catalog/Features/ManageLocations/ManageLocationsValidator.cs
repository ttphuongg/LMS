using FluentValidation;

namespace Library.Modules.Core.Catalog.Features.ManageLocations;

public sealed class AddLocationValidator : AbstractValidator<AddLocationRequest>
{
    public AddLocationValidator()
    {
        RuleFor(x => x.Aisle)
            .NotEmpty().WithMessage("Dãy kệ không được để trống.")
            .MaximumLength(50).WithMessage("Dãy kệ tối đa 50 ký tự.");

        RuleFor(x => x.Shelf)
            .NotEmpty().WithMessage("Kệ không được để trống.")
            .MaximumLength(50).WithMessage("Kệ tối đa 50 ký tự.");

        RuleFor(x => x.RowLevel)
            .GreaterThan(0).WithMessage("Tầng/hàng phải lớn hơn 0.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("Sức chứa tối đa phải lớn hơn 0.")
            .When(x => x.MaxCapacity.HasValue);
    }
}

public sealed class UpdateLocationValidator : AbstractValidator<UpdateLocationRequest>
{
    public UpdateLocationValidator()
    {
        RuleFor(x => x.LocationId)
            .GreaterThan(0).WithMessage("LocationId không hợp lệ.");

        RuleFor(x => x.Aisle)
            .NotEmpty().WithMessage("Dãy kệ không được để trống.")
            .MaximumLength(50).WithMessage("Dãy kệ tối đa 50 ký tự.");

        RuleFor(x => x.Shelf)
            .NotEmpty().WithMessage("Kệ không được để trống.")
            .MaximumLength(50).WithMessage("Kệ tối đa 50 ký tự.");

        RuleFor(x => x.RowLevel)
            .GreaterThan(0).WithMessage("Tầng/hàng phải lớn hơn 0.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("Sức chứa tối đa phải lớn hơn 0.")
            .When(x => x.MaxCapacity.HasValue);
    }
}

