using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.Logout;

public record LogoutRequest(int AccountId) : IRequest<ApiResponse<bool>>;
