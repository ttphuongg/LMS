using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Billing.Data.Configurations;

public class FineConfiguration : IEntityTypeConfiguration<Fine>
{
    public void Configure(EntityTypeBuilder<Fine> builder)
    {
        builder.ToTable("Fines");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(f => f.IssuedAt).HasDefaultValueSql("SYSDATETIME()");

        builder.Property(f => f.FineType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(f => f.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(FineStatus.Unpaid);

        // Check constraints
        builder.ToTable("Fines", t =>
        {
            t.HasCheckConstraint("CK_Fines_Amount", "[Amount] > 0");
            t.HasCheckConstraint("CK_Fines_FineType", "[FineType] IN (N'Overdue', N'Compensation', N'Other')");
            t.HasCheckConstraint("CK_Fines_Status", "[Status] IN (N'Unpaid', N'PartiallyPaid', N'Paid', N'Cancelled')");
        });

        // Cross-context FKs (no navigation properties)
        builder.HasOne<Account>()
            .WithMany()
            .HasForeignKey(f => f.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<LoanSlipDetail>()
            .WithMany()
            .HasForeignKey(f => f.LoanSlipDetailId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne<Incident>()
            .WithMany()
            .HasForeignKey(f => f.IncidentId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // Within Billing context
        builder.HasMany(f => f.Payments)
            .WithOne(p => p.Fine)
            .HasForeignKey(p => p.FineId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
