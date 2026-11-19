using FluentValidation;

namespace Library.Modules.Core.Identity.Features.VerifyEmailOtp;

public sealed class VerifyEmailOtpValidator : AbstractValidator<VerifyEmailOtpRequest>
{
    public VerifyEmailOtpValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(150).WithMessage("Email tối đa 150 ký tự.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã xác thực không được để trống.")
            .Length(6).WithMessage("Mã xác thực phải gồm đúng 6 chữ số.")
            .Matches(@"^\d{6}$").WithMessage("Mã xác thực chỉ chứa 6 chữ số.");
    }
}
