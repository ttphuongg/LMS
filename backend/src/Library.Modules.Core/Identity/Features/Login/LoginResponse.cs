namespace Library.Modules.Core.Identity.Features.Login;

/// <summary>
/// Response DTO returned upon successful authentication.
/// Contains both access and refresh tokens along with basic account info.
/// </summary>
public record LoginResponse(
    int AccountId,
    string Username,
    string FullName,
    string Email,
    string Role,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt
);
