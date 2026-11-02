using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.ChangePassword;

public record ChangePasswordRequest(int AccountId, string CurrentPassword, string NewPassword) : IRequest<ApiResponse<bool>>;
