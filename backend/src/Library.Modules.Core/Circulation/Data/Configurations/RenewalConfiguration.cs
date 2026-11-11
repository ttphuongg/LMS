using Library.Modules.Core.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Circulation.Data.Configurations;

public class RenewalConfiguration : IEntityTypeConfiguration<Renewal>
{
    public void Configure(EntityTypeBuilder<Renewal> builder)
    {
        builder.ToTable("Renewals");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RequestedAt).HasDefaultValueSql("SYSDATETIME()");
        builder.Property(r => r.Reason).HasMaxLength(500);
        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(RenewalStatus.Pending);

        // UQ_GiaHan: (LoanSlipDetailId, RenewalNumber)
        builder.HasIndex(r => new { r.LoanSlipDetailId, r.RenewalNumber }).IsUnique();

        // CK_GiaHan_LanGiaHan
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Renewals_RenewalNumber", "[RenewalNumber] > 0"));

        // CK_GiaHan_NgayMoi
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Renewals_NewDueDate", "[NewDueDate] > [OldDueDate]"));

        // CK_Renewals_Status
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Renewals_Status", "[Status] IN (N'Pending', N'Approved', N'Rejected', N'Cancelled')"));

        builder.HasOne(r => r.LoanSlipDetail)
            .WithMany(d => d.Renewals)
            .HasForeignKey(r => r.LoanSlipDetailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
