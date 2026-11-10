using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Circulation.Data.Configurations;

public class LoanSlipConfiguration : IEntityTypeConfiguration<LoanSlip>
{
    public void Configure(EntityTypeBuilder<LoanSlip> builder)
    {
        builder.ToTable("LoanSlips");
        builder.HasKey(ls => ls.Id);

        builder.Property(ls => ls.BorrowedAt).HasDefaultValueSql("SYSDATETIME()");
        builder.Property(ls => ls.Notes).HasMaxLength(500);

        builder.Property(ls => ls.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(LoanStatus.Borrowing);

        builder.Property(ls => ls.RowVersion)
            .IsRowVersion();

        // Check constraints
        builder.ToTable("LoanSlips", t =>
        {
            t.HasCheckConstraint("CK_LoanSlips_DueDate", "[DueDate] >= CAST([BorrowedAt] AS DATE)");
            t.HasCheckConstraint("CK_LoanSlips_Status", "[Status] IN (N'Pending', N'Borrowing', N'Returned', N'Overdue', N'Cancelled')");
        });

        // Within Circulation context navigation
        builder.HasMany(ls => ls.Details)
            .WithOne(d => d.LoanSlip)
            .HasForeignKey(d => d.LoanSlipId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
