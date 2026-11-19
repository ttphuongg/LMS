using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.ResendEmailOtp;

public record ResendEmailOtpRequest(
    string Email
) : IRequest<ApiResponse<bool>>;
