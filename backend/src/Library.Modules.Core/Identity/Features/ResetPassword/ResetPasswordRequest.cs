using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.ResetPassword;

public record ResetPasswordRequest(
    string Email,
    string TokenOrOtp,
    string NewPassword
) : IRequest<ApiResponse<string>>;
