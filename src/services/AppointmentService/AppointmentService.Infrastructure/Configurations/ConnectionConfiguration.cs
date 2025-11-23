using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointmentService.Infrastructure.Configurations;

/// <summary>
/// Entity Framework configuration for Connection entity
/// </summary>
public class ConnectionConfiguration : IEntityTypeConfiguration<Connection>
{
    public void Configure(EntityTypeBuilder<Connection> builder)
    {
        // Primary Key
        builder.HasKey(c => c.Id);

        // Indexes for performance
        builder.HasIndex(c => c.MatchRequestId);
        builder.HasIndex(c => c.RequesterId);
        builder.HasIndex(c => c.TargetUserId);
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.ConnectionType);
        builder.HasIndex(c => new { c.RequesterId, c.TargetUserId });
        builder.HasIndex(c => new { c.Status, c.EstablishedAt });

        // Properties
        builder.Property(c => c.MatchRequestId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(c => c.RequesterId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(c => c.TargetUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(c => c.ConnectionType)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue(ConnectionType.SkillExchange);

        builder.Property(c => c.SkillId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(c => c.ExchangeSkillId)
            .HasMaxLength(450);

        builder.Property(c => c.PaymentRatePerHour)
            .HasPrecision(18, 2);

        builder.Property(c => c.Currency)
            .HasMaxLength(10);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue(ConnectionStatus.Active);

        builder.Property(c => c.StatusReason)
            .HasMaxLength(1000);

        builder.Property(c => c.EstablishedAt)
            .IsRequired();

        // Relationships
        builder.HasMany(c => c.SessionSeries)
            .WithOne(s => s.Connection)
            .HasForeignKey(s => s.ConnectionId)
            .OnDelete(DeleteBehavior.Cascade); // Cascade delete session series when connection is deleted

        // Soft delete filter
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}
