using FluentValidation;

namespace Library.Modules.Core.Identity.Features.Login;

public sealed class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}
