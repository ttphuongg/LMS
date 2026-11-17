using FluentValidation;

namespace Library.Modules.Core.Identity.Features.ResetPassword;

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập địa chỉ email.")
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.");

        RuleFor(x => x.TokenOrOtp)
            .NotEmpty().WithMessage("Vui lòng nhập mã Token hoặc mã OTP xác thực.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có tối thiểu 6 ký tự.")
            .MaximumLength(100).WithMessage("Mật khẩu tối đa 100 ký tự.");
    }
}

