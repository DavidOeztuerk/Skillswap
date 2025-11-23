using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointmentService.Infrastructure.Configurations;

/// <summary>
/// Entity Framework configuration for SessionRating entity
/// </summary>
public class SessionRatingConfiguration : IEntityTypeConfiguration<SessionRating>
{
    public void Configure(EntityTypeBuilder<SessionRating> builder)
    {
        // Primary Key
        builder.HasKey(r => r.Id);

        // Indexes for performance
        builder.HasIndex(r => r.SessionAppointmentId);
        builder.HasIndex(r => r.RaterId);
        builder.HasIndex(r => r.RateeId);
        builder.HasIndex(r => r.Rating);
        builder.HasIndex(r => new { r.RateeId, r.IsPublic });
        builder.HasIndex(r => new { r.RateeId, r.CreatedAt });
        builder.HasIndex(r => new { r.SessionAppointmentId, r.RaterId });

        // Properties
        builder.Property(r => r.SessionAppointmentId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(r => r.RaterId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(r => r.RateeId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Feedback)
            .HasMaxLength(2000);

        builder.Property(r => r.IsPublic)
            .HasDefaultValue(true);

        builder.Property(r => r.Tags)
            .HasMaxLength(500);

        builder.Property(r => r.RateeResponse)
            .HasMaxLength(1000);

        builder.Property(r => r.IsFlagged)
            .HasDefaultValue(false);

        builder.Property(r => r.FlagReason)
            .HasMaxLength(500);

        // Foreign key relationship
        builder.HasOne(r => r.SessionAppointment)
            .WithMany()
            .HasForeignKey(r => r.SessionAppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete filter
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
