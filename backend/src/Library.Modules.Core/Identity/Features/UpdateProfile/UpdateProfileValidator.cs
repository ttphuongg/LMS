using FluentValidation;

namespace Library.Modules.Core.Identity.Features.UpdateProfile;

public sealed class UpdateProfileValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.AccountId)
            .GreaterThan(0).WithMessage("AccountId không hợp lệ.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .MaximumLength(150).WithMessage("Họ tên tối đa 150 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự.")
            .Matches(@"^(?:0|84|\+84)[35789]\d{8}$").WithMessage("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ tối đa 255 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.DateOfBirth)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("Ngày sinh không được lớn hơn ngày hiện tại.")
            .When(x => x.DateOfBirth.HasValue);
    }
}
