using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.UpdateProfile;

/// <summary>Updates personal information of an existing account.</summary>
public record UpdateProfileRequest(
    int AccountId,
    string FullName,
    string? PhoneNumber,
    string? Address,
    DateOnly? DateOfBirth
) : IRequest<ApiResponse<bool>>;
