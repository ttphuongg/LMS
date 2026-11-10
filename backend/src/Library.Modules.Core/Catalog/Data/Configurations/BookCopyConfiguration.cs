using Library.Modules.Core.Catalog.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Catalog.Data.Configurations;

public class BookCopyConfiguration : IEntityTypeConfiguration<BookCopy>
{
    public void Configure(EntityTypeBuilder<BookCopy> builder)
    {
        builder.ToTable("BookCopies");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Barcode).HasMaxLength(50).IsUnicode(false).IsRequired();

        builder.Property(c => c.Condition)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(CopyCondition.Good);

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(CopyStatus.Available);

        builder.Property(c => c.AcquiredDate)
            .HasDefaultValueSql("CAST(GETDATE() AS DATE)");

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("SYSDATETIME()");

        builder.Property(c => c.RowVersion)
            .IsRowVersion();

        builder.HasIndex(c => c.Barcode).IsUnique();

        // Check constraints
        builder.ToTable("BookCopies", t =>
        {
            t.HasCheckConstraint("CK_BookCopies_Condition", "[Condition] IN (N'Good', N'MinorDamage', N'MajorDamage', N'Lost')");
            t.HasCheckConstraint("CK_BookCopies_Status", "[Status] IN (N'Available', N'Reserved', N'Borrowed', N'Maintenance', N'Lost', N'Inactive')");
        });

        builder.HasOne(c => c.Book)
            .WithMany(b => b.Copies)
            .HasForeignKey(c => c.BookId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK → Locations (nullable, RESTRICT delete)
        builder.HasOne(c => c.Location)
            .WithMany(l => l.BookCopies)
            .HasForeignKey(c => c.LocationId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasIndex(c => c.LocationId);
    }
}
