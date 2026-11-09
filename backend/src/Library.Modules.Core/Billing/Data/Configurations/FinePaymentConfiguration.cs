using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Library.Modules.Core.Billing.Data.Configurations;

public class FinePaymentConfiguration : IEntityTypeConfiguration<FinePayment>
{
    public void Configure(EntityTypeBuilder<FinePayment> builder)
    {
        builder.ToTable("FinePayments");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(p => p.PaidAt).HasDefaultValueSql("SYSDATETIME()");
        builder.Property(p => p.Notes).HasMaxLength(500);

        builder.Property(p => p.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(30);

        // Check constraints
        builder.ToTable("FinePayments", t =>
        {
            t.HasCheckConstraint("CK_FinePayments_Amount", "[Amount] > 0");
            t.HasCheckConstraint("CK_FinePayments_PaymentMethod", "[PaymentMethod] IN (N'Cash', N'BankTransfer', N'Other')");
        });

        // FK → Fines (NO ACTION — bảo vệ dữ liệu kế toán)
        builder.HasOne(p => p.Fine)
            .WithMany(f => f.Payments)
            .HasForeignKey(p => p.FineId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
