using FluentValidation;

namespace Library.Modules.Core.Identity.Features.ChangePassword;

public class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("AccountId không h?p l?.");
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Vui l?ng nh?p m?t kh?u hi?n t?i.");
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).WithMessage("M?t kh?u m?i ph?i có ít nh?t 6 k? t?.");
    }
}
