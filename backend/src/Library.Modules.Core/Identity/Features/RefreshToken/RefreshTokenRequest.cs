using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.RefreshToken;

public record RefreshTokenRequest(string RefreshToken) : IRequest<ApiResponse<LoginResponse>>;
