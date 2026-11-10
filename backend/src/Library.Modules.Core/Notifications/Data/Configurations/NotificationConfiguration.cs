using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Notifications.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
        builder.Property(n => n.Content).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(n => n.IsRead).HasDefaultValue(false);
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("SYSDATETIME()");

        builder.Property(n => n.NotificationType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.ToTable("Notifications", t =>
        {
            t.HasCheckConstraint("CK_Notifications_NotificationType", "[NotificationType] IN (N'Reserve', N'Borrow', N'Return', N'Fine', N'System')");
        });
    }
}
