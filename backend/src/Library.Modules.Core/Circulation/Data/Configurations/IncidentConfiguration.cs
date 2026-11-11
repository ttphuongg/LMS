using Library.Modules.Core.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Circulation.Data.Configurations;

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> builder)
    {
        builder.ToTable("Incidents");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Description).HasMaxLength(1000);
        builder.Property(i => i.CompensationAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);
        builder.Property(i => i.RecordedAt).HasDefaultValueSql("SYSDATETIME()");

        builder.Property(i => i.IncidentType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.Severity)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(IncidentStatus.Recorded);

        // Check constraints
        builder.ToTable("Incidents", t =>
        {
            t.HasCheckConstraint("CK_Incidents_CompensationAmount", "[CompensationAmount] >= 0");
            t.HasCheckConstraint("CK_Incidents_IncidentType", "[IncidentType] IN (N'Lost', N'Damaged')");
            t.HasCheckConstraint("CK_Incidents_Severity", "[Severity] IN (N'Minor', N'Major', N'TotalLoss')");
            t.HasCheckConstraint("CK_Incidents_Status", "[Status] IN (N'Recorded', N'Resolved', N'Cancelled')");
        });

        builder.HasOne(i => i.LoanSlipDetail)
            .WithMany(d => d.Incidents)
            .HasForeignKey(i => i.LoanSlipDetailId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
