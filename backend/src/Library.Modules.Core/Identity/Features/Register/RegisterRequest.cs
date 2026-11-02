using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.Register;

public record RegisterRequest(
    string Username,
    string FullName,
    string Email,
    string Password,
    string? PhoneNumber = null
) : IRequest<ApiResponse<int>>;
