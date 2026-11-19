using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.VerifyEmailOtp;

public record VerifyEmailOtpRequest(
    string Email,
    string Otp
) : IRequest<ApiResponse<bool>>;
