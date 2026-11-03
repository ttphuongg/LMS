using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Identity.Features.Logout;

public sealed class LogoutHandler : IRequestHandler<LogoutRequest, ApiResponse<bool>>
{
    private readonly AppDbContext _db;

    public LogoutHandler(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(LogoutRequest request, CancellationToken ct)
    {
        var activeSessions = await _db.LoginSessions
            .Where(s => s.AccountId == request.AccountId && s.LoggedOutAt == null)
            .ToListAsync(ct);

        foreach (var session in activeSessions)
        {
            session.LoggedOutAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
