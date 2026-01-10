using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Data.Configurations;

public class PaymentProductConfiguration : IEntityTypeConfiguration<PaymentProduct>
{
    public void Configure(EntityTypeBuilder<PaymentProduct> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.ProductType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.BoostType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.Property(p => p.Currency)
            .IsRequired()
            .HasMaxLength(3)
            .HasDefaultValue("EUR");

        builder.Property(p => p.StripePriceId)
            .HasMaxLength(500);

        // Indexes
        builder.HasIndex(p => p.ProductType);
        builder.HasIndex(p => p.IsActive);
        builder.HasIndex(p => p.SortOrder);
    }
}
