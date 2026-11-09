using Library.Modules.Core.Notifications.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Notifications.Data;

public class NotificationsDbContext(DbContextOptions<NotificationsDbContext> options) : DbContext(options)
{
    public const string Schema = "notifications";

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(NotificationsDbContext).Assembly,
            t => t.Namespace?.StartsWith("Library.Modules.Core.Notifications") == true);
    }
}
