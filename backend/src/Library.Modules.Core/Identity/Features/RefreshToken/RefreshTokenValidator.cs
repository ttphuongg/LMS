using FluentValidation;

namespace Library.Modules.Core.Identity.Features.RefreshToken;

public class RefreshTokenValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().WithMessage("Refresh token không h?p l?.");
    }
}
