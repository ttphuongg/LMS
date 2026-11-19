using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Identity.Data.Configurations;

public class EmailVerificationOtpConfiguration : IEntityTypeConfiguration<EmailVerificationOtp>
{
    public void Configure(EntityTypeBuilder<EmailVerificationOtp> builder)
    {
        builder.ToTable("EmailVerificationOtps");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Email)
            .HasMaxLength(150)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.OtpHash)
            .HasMaxLength(64)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.FailedAttempts)
            .HasDefaultValue(0);

        builder.Property(t => t.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(t => new { t.AccountId, t.UsedAt });
        builder.HasIndex(t => t.Email);

        builder.HasOne(t => t.Account)
            .WithMany()
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
