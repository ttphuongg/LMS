using FluentValidation;

namespace Library.Modules.Core.Notifications.Features.MarkAsRead;

public class MarkAsReadValidator : AbstractValidator<MarkAsReadRequest>
{
    public MarkAsReadValidator()
    {
        RuleFor(x => x.NotificationId).GreaterThan(0);
        RuleFor(x => x.AccountId).GreaterThan(0);
    }
}
