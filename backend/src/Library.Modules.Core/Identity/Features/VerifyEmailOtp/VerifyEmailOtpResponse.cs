namespace Library.Modules.Core.Identity.Features.VerifyEmailOtp;

/// <summary>
/// Response returned upon successful email verification and automatic login.
/// </summary>
public record VerifyEmailOtpResponse(
    int AccountId,
    string Username,
    string FullName,
    string Email,
    string Role,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt
);

