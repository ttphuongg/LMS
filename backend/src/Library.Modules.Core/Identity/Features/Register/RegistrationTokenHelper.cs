using System.Security.Cryptography;
using System.Text;

namespace Library.Modules.Core.Identity.Features.Register;

public static class RegistrationTokenHelper
{
    private const string Purpose = "LibriRegistrationSession_v1";

    public static string GenerateToken(int accountId, string email, string secretKey, TimeSpan? expiry = null)
    {
        var expiresAtUtc = DateTime.UtcNow.Add(expiry ?? TimeSpan.FromHours(2)).Ticks;
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var payload = $"{accountId}|{normalizedEmail}|{expiresAtUtc}|{Purpose}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        var raw = $"{payload}|{signature}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
    }

    public static bool TryValidateToken(string? token, string secretKey, out int accountId, out string email)
    {
        accountId = 0;
        email = string.Empty;

        if (string.IsNullOrWhiteSpace(token))
            return false;

        try
        {
            var raw = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = raw.Split('|');
            if (parts.Length != 5)
                return false;

            if (!int.TryParse(parts[0], out accountId))
                return false;

            email = parts[1];
            if (!long.TryParse(parts[2], out var expiresAtTicks))
                return false;

            var purpose = parts[3];
            var signature = parts[4];

            if (purpose != Purpose)
                return false;

            if (DateTime.UtcNow.Ticks > expiresAtTicks)
                return false;

            var payload = $"{accountId}|{email}|{expiresAtTicks}|{Purpose}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var expectedSignature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

            if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(signature),
                Encoding.UTF8.GetBytes(expectedSignature)))
            {
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }
}
