using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Catalog.Data.Configurations;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.ToTable("Locations");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Aisle)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(l => l.Shelf)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(l => l.RowLevel)
            .IsRequired();

        builder.Property(l => l.IsActive)
            .HasDefaultValue(true);

        builder.Property(l => l.CreatedAt)
            .HasDefaultValueSql("SYSDATETIME()");

        // UQ: (Aisle, Shelf, RowLevel) phải là tọa độ duy nhất
        builder.HasIndex(l => new { l.Aisle, l.Shelf, l.RowLevel })
            .IsUnique()
            .HasDatabaseName("UQ_Locations_Coordinates");

        // Check constraints
        builder.ToTable("Locations", t =>
        {
            t.HasCheckConstraint("CK_Locations_RowLevel", "[RowLevel] > 0");
            t.HasCheckConstraint("CK_Locations_MaxCapacity", "[MaxCapacity] IS NULL OR [MaxCapacity] > 0");
        });

        // Navigation: một Location có nhiều BookCopy
        // ON DELETE RESTRICT — cấm xóa Location nếu còn BookCopy tham chiếu
        builder.HasMany(l => l.BookCopies)
            .WithOne(c => c.Location)
            .HasForeignKey(c => c.LocationId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}

