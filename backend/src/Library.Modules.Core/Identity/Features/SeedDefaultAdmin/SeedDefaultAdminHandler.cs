using BCrypt.Net;
using Library.Modules.Core.Identity.Contracts;
using Library.Modules.Core.Identity.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Identity.Features.SeedDefaultAdmin;

public sealed class SeedDefaultAdminHandler : IRequestHandler<SeedDefaultAdminCommand, bool>
{
    private readonly IdentityDbContext _db;
    private readonly IConfiguration _cfg;
    private readonly ILogger<SeedDefaultAdminHandler> _logger;

    public SeedDefaultAdminHandler(IdentityDbContext db, IConfiguration cfg, ILogger<SeedDefaultAdminHandler> logger)
    {
        _db = db;
        _cfg = cfg;
        _logger = logger;
    }

    public async Task<bool> Handle(SeedDefaultAdminCommand request, CancellationToken ct)
    {
        if (await _db.Accounts.AnyAsync(a => a.Role == AccountRole.Admin, ct))
        {
            return false;
        }

        var adminUsername = Environment.GetEnvironmentVariable("ADMIN_SEED_USERNAME")
            ?? _cfg["AdminSeed:Username"]
            ?? "admin";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_SEED_PASSWORD")
            ?? _cfg["AdminSeed:Password"]
            ?? "Admin@123456";
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_SEED_EMAIL")
            ?? _cfg["AdminSeed:Email"]
            ?? "admin@library.vn";
        var adminFullName = Environment.GetEnvironmentVariable("ADMIN_SEED_FULLNAME")
            ?? _cfg["AdminSeed:FullName"]
            ?? "System Administrator";

        var admin = new Account
        {
            Username = adminUsername.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            FullName = adminFullName,
            Email = adminEmail.Trim().ToLowerInvariant(),
            Role = AccountRole.Admin,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Accounts.Add(admin);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("[Seed] Admin account created: username='{Username}'", adminUsername);
        return true;
    }
}

