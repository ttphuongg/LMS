using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.Login;

public record LoginRequest(
    string Username,
    string Password
) : IRequest<ApiResponse<LoginResponse>>;
