using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.GetMyProfile;

public record GetMyProfileRequest(int AccountId) : IRequest<ApiResponse<ProfileDto>>;
public record ProfileDto(int Id, string Username, string FullName, string Email, string? PhoneNumber, string? Address, DateOnly? DateOfBirth, string Role, string Status, DateTime CreatedAt, DateTime? LastLoginAt);
