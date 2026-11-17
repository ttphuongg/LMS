using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.ForgotPassword;

public record ForgotPasswordRequest(string Email) : IRequest<ApiResponse<string>>;
