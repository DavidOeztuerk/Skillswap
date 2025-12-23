using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointmentService.Infrastructure.Configurations;

/// <summary>
/// Entity Framework configuration for SessionPayment entity
/// </summary>
public class SessionPaymentConfiguration : IEntityTypeConfiguration<SessionPayment>
{
    public void Configure(EntityTypeBuilder<SessionPayment> builder)
    {
        // Primary Key
        builder.HasKey(p => p.Id);

        // Indexes for performance
        builder.HasIndex(p => p.SessionAppointmentId);
        builder.HasIndex(p => p.PayerId);
        builder.HasIndex(p => p.PayeeId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.TransactionId);
        builder.HasIndex(p => new { p.PayerId, p.Status });
        builder.HasIndex(p => new { p.PayeeId, p.Status });
        builder.HasIndex(p => new { p.Status, p.CreatedAt });
        builder.HasIndex(p => new { p.SessionAppointmentId, p.Status });

        // Properties
        builder.Property(p => p.SessionAppointmentId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(p => p.PayerId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(p => p.PayeeId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.Currency)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("EUR");

        builder.Property(p => p.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue(SessionPaymentStatus.Pending);

        builder.Property(p => p.TransactionId)
            .HasMaxLength(500);

        builder.Property(p => p.Provider)
            .HasMaxLength(100);

        builder.Property(p => p.PaymentMethod)
            .HasMaxLength(100);

        builder.Property(p => p.CardLast4)
            .HasMaxLength(4);

        builder.Property(p => p.ErrorMessage)
            .HasMaxLength(1000);

        builder.Property(p => p.RefundForPaymentId)
            .HasMaxLength(450);

        builder.Property(p => p.RefundReason)
            .HasMaxLength(500);

        builder.Property(p => p.PlatformFee)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(p => p.NetAmount)
            .HasPrecision(18, 2);

        builder.Property(p => p.Metadata)
            .HasMaxLength(2000);

        builder.Property(p => p.RetryCount)
            .HasDefaultValue(0);

        builder.Property(p => p.MaxRetries)
            .HasDefaultValue(3);

        // Foreign key relationship
        builder.HasOne(p => p.SessionAppointment)
            .WithMany()
            .HasForeignKey(p => p.SessionAppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
