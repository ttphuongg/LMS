using Library.Modules.Core.Identity.Data;
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
        builder.Property(n => n.Content).IsRequired();
        builder.Property(n => n.IsRead).HasDefaultValue(false);
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(n => n.NotificationType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.ToTable("Notifications", t =>
        {
            t.HasCheckConstraint("CK_Notifications_NotificationType", "\"NotificationType\" IN ('Reserve', 'Borrow', 'Return', 'Fine', 'System')");
        });
    }
}
