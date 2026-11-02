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
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    /// <summary>
    /// Creates a signed JWT access token containing user claims (sub, name, email, role).
    /// </summary>
    public string GenerateAccessToken(Account account)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiryMinutes = int.Parse(_config["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");

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
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
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
        var days = int.Parse(_config["JwtSettings:RefreshTokenExpiryDays"] ?? "7");
        return DateTime.UtcNow.AddDays(days);
    }
}