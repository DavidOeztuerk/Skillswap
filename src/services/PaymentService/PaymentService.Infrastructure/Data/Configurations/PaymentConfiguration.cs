using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.UserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(p => p.ProductId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(p => p.ReferenceId)
            .HasMaxLength(450);

        builder.Property(p => p.ReferenceType)
            .HasMaxLength(100);

        builder.Property(p => p.StripeSessionId)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.StripePaymentIntentId)
            .HasMaxLength(500);

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2);

        builder.Property(p => p.Currency)
            .IsRequired()
            .HasMaxLength(3)
            .HasDefaultValue("EUR");

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.FailureReason)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => p.StripeSessionId).IsUnique();
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.CreatedAt);

        // Relationship
        builder.HasOne(p => p.Product)
            .WithMany(pp => pp.Payments)
            .HasForeignKey(p => p.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
