using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Library.Modules.Core.Identity.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Library.Modules.Core.Identity.Services;

/// <summary>
/// Generates JWT access tokens and opaque refresh tokens for authenticated users.
/// </summary>
public sealed class JwtTokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenExpiryMinutes;
    private readonly int _refreshTokenExpiryDays;

    public JwtTokenService(IConfiguration config)
    {
        _secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? config["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        _issuer = config["JwtSettings:Issuer"] ?? "LibrarySystem";
        _audience = config["JwtSettings:Audience"] ?? "LibrarySystemClient";
        _accessTokenExpiryMinutes = int.TryParse(config["JwtSettings:AccessTokenExpiryMinutes"], out var accessMins) ? accessMins : 60;
        _refreshTokenExpiryDays = int.TryParse(config["JwtSettings:RefreshTokenExpiryDays"], out var refDays) ? refDays : 7;
    }

    public int GetAccessTokenExpiryMinutes() => _accessTokenExpiryMinutes;
    public DateTime GetAccessTokenExpiry() => DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes);

    /// <summary>
    /// Creates a signed JWT access token containing user claims (sub, name, email, role).
    /// </summary>
    public string GenerateAccessToken(Account account)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, account.Username),
            new Claim(ClaimTypes.Name, account.Username),
            new Claim(JwtRegisteredClaimNames.Email, account.Email),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Role, account.Role.ToString()),
            new Claim("role", account.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: GetAccessTokenExpiry(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generates a cryptographically secure random refresh token (Base64-encoded).
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// Returns the configured refresh token expiry as a UTC DateTime.
    /// </summary>
    public DateTime GetRefreshTokenExpiry()
    {
        return DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);
    }
}
