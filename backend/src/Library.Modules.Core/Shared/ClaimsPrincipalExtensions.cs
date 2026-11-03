using System.Security.Claims;

namespace Library.Modules.Core.Shared;

public static class ClaimsPrincipalExtensions
{
    public static int GetAccountId(this ClaimsPrincipal user)
    {
        var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("sub")?.Value;

        if (int.TryParse(idStr, out var id))
        {
            return id;
        }

        throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
    }

    public static string? GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value;
    }

    public static bool IsStaff(this ClaimsPrincipal user)
    {
        var role = user.GetRole();
        return role == "Librarian" || role == "Admin";
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.GetRole() == "Admin";
    }
}