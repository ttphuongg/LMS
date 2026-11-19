using FluentValidation;

namespace Library.Modules.Core.Identity.Features.ResendEmailOtp;

public sealed class ResendEmailOtpValidator : AbstractValidator<ResendEmailOtpRequest>
{
    public ResendEmailOtpValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(150).WithMessage("Email tối đa 150 ký tự.");
    }
}
