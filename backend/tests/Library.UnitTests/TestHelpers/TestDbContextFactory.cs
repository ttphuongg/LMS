using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Notifications.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.UnitTests.TestHelpers;

public static class TestDbContextFactory
{
    public static CirculationDbContext CreateCirculationDbContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<CirculationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new CirculationDbContext(options);
    }

    public static BillingDbContext CreateBillingDbContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<BillingDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new BillingDbContext(options);
    }

    public static CatalogDbContext CreateCatalogDbContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<CatalogDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new CatalogDbContext(options);
    }

    public static IdentityDbContext CreateIdentityDbContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new IdentityDbContext(options);
    }

    public static NotificationsDbContext CreateNotificationsDbContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<NotificationsDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new NotificationsDbContext(options);
    }
}
