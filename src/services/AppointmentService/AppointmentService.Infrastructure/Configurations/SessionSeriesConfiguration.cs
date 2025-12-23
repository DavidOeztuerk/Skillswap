using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointmentService.Infrastructure.Configurations;

/// <summary>
/// Entity Framework configuration for SessionSeries entity
/// </summary>
public class SessionSeriesConfiguration : IEntityTypeConfiguration<SessionSeries>
{
    public void Configure(EntityTypeBuilder<SessionSeries> builder)
    {
        // Primary Key
        builder.HasKey(s => s.Id);

        // Indexes for performance
        builder.HasIndex(s => s.ConnectionId);
        builder.HasIndex(s => s.TeacherUserId);
        builder.HasIndex(s => s.LearnerUserId);
        builder.HasIndex(s => s.SkillId);
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => new { s.ConnectionId, s.Status });
        builder.HasIndex(s => new { s.TeacherUserId, s.Status });
        builder.HasIndex(s => new { s.LearnerUserId, s.Status });

        // Properties
        builder.Property(s => s.ConnectionId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Description)
            .HasMaxLength(2000);

        builder.Property(s => s.TeacherUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(s => s.LearnerUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(s => s.SkillId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue(SeriesStatus.Planned);

        builder.Property(s => s.StatusReason)
            .HasMaxLength(1000);

        builder.Property(s => s.TotalSessions)
            .HasDefaultValue(1);

        builder.Property(s => s.CompletedSessions)
            .HasDefaultValue(0);

        builder.Property(s => s.DefaultDurationMinutes)
            .HasDefaultValue(60);

        builder.Property(s => s.PlannedAt)
            .IsRequired();

        // Relationships
        builder.HasMany(s => s.SessionAppointments)
            .WithOne(a => a.SessionSeries)
            .HasForeignKey(a => a.SessionSeriesId)
            .OnDelete(DeleteBehavior.Cascade); // Cascade delete appointments when series is deleted

        // Soft delete filter
        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
