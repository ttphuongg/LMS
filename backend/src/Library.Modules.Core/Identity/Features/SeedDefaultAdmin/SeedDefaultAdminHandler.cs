using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Library.Modules.Core.Identity.Features.SeedDefaultAdmin;

public sealed class SeedDefaultAdminHandler : IRequestHandler<SeedDefaultAdminCommand, bool>
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public SeedDefaultAdminHandler(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    public async Task<bool> Handle(SeedDefaultAdminCommand request, CancellationToken ct)
    {
        if (await _db.Accounts.AnyAsync(a => a.Role == AccountRole.Admin, ct))
            return false;

        var adminUsername = _cfg["AdminSeed:Username"] ?? "admin";
        var adminPassword = _cfg["AdminSeed:Password"] ?? "Admin@123456";
        var adminEmail = _cfg["AdminSeed:Email"] ?? "admin@library.vn";
        var adminFullName = _cfg["AdminSeed:FullName"] ?? "System Administrator";

        _db.Accounts.Add(new Account
        {
            Username = adminUsername.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            FullName = adminFullName,
            Email = adminEmail.Trim().ToLowerInvariant(),
            Role = AccountRole.Admin,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        Console.WriteLine($"[Seed] Admin account created: username='{adminUsername}'");
        return true;
    }
}

