using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Catalog.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Circulation.Data.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReservedAt).HasDefaultValueSql("SYSDATETIME()");
        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ReservationStatus.Waiting);

        builder.Property(r => r.RowVersion)
            .IsRowVersion();

        // Check constraints
        builder.ToTable("Reservations", t =>
        {
            t.HasCheckConstraint("CK_Reservations_ExpiresAt", "[ExpiresAt] IS NULL OR [ExpiresAt] > [ReservedAt]");
            t.HasCheckConstraint("CK_Reservations_Status", "[Status] IN (N'Waiting', N'Ready', N'Completed', N'Cancelled', N'Expired')");
        });
    }
}
