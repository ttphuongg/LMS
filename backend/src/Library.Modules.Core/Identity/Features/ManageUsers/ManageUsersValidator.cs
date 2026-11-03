using FluentValidation;

namespace Library.Modules.Core.Identity.Features.ManageUsers;

public class ChangeRoleValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("AccountId không hợp lệ.");
        RuleFor(x => x.NewRole).IsInEnum().WithMessage("Role không hợp lệ.");
    }
}

public class ChangeStatusValidator : AbstractValidator<ChangeStatusRequest>
{
    public ChangeStatusValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("AccountId không hợp lệ.");
        RuleFor(x => x.NewStatus).IsInEnum().WithMessage("Status không hợp lệ.");
    }
}
