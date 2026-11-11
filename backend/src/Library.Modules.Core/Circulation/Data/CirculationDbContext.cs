using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Data;

public class CirculationDbContext(DbContextOptions<CirculationDbContext> options) : DbContext(options)
{
    public const string Schema = "circulation";

    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<LoanSlip> LoanSlips => Set<LoanSlip>();
    public DbSet<LoanSlipDetail> LoanSlipDetails => Set<LoanSlipDetail>();
    public DbSet<Renewal> Renewals => Set<Renewal>();
    public DbSet<Incident> Incidents => Set<Incident>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CirculationDbContext).Assembly,
            t => t.Namespace?.StartsWith("Library.Modules.Core.Circulation") == true);
    }
}

