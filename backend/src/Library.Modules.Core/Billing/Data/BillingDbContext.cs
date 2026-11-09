using Library.Modules.Core.Billing.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Billing.Data;

public class BillingDbContext(DbContextOptions<BillingDbContext> options) : DbContext(options)
{
    public const string Schema = "billing";

    public DbSet<Fine> Fines => Set<Fine>();
    public DbSet<FinePayment> FinePayments => Set<FinePayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(BillingDbContext).Assembly,
            t => t.Namespace?.StartsWith("Library.Modules.Core.Billing") == true);
    }
}
