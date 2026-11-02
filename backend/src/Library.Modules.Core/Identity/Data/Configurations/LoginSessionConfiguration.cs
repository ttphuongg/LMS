using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Identity.Data.Configurations;

public class LoginSessionConfiguration : IEntityTypeConfiguration<LoginSession>
{
    public void Configure(EntityTypeBuilder<LoginSession> builder)
    {
        builder.ToTable("LoginSessions");
        builder.HasKey(ls => ls.Id);

        builder.Property(ls => ls.RefreshTokenHash)
            .HasMaxLength(255);

        builder.Property(ls => ls.IpAddress)
            .HasMaxLength(45); // IPv6 max

        builder.Property(ls => ls.UserAgent)
            .HasMaxLength(500);

        builder.Property(ls => ls.LoggedInAt)
            .HasDefaultValueSql("SYSDATETIME()");

        // CK_PhienDangNhap_ThoiGian: ExpiresAt > LoggedInAt
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_LoginSessions_ExpiresAt",
            "[ExpiresAt] > [LoggedInAt]"));

        // FK → Accounts (NO ACTION — giữ lại session để audit)
        builder.HasOne(ls => ls.Account)
            .WithMany(a => a.LoginSessions)
            .HasForeignKey(ls => ls.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
