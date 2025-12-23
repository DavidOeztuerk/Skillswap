using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointmentService.Infrastructure.Configurations;

/// <summary>
/// Entity Framework configuration for SessionAppointment entity
/// </summary>
public class SessionAppointmentConfiguration : IEntityTypeConfiguration<SessionAppointment>
{
    public void Configure(EntityTypeBuilder<SessionAppointment> builder)
    {
        // Primary Key
        builder.HasKey(a => a.Id);

        // Indexes for performance
        builder.HasIndex(a => a.SessionSeriesId);
        builder.HasIndex(a => a.OrganizerUserId);
        builder.HasIndex(a => a.ParticipantUserId);
        builder.HasIndex(a => a.ScheduledDate);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.MeetingType);
        builder.HasIndex(a => new { a.ScheduledDate, a.Status });
        builder.HasIndex(a => new { a.SessionSeriesId, a.SessionNumber });
        builder.HasIndex(a => new { a.OrganizerUserId, a.Status });
        builder.HasIndex(a => new { a.ParticipantUserId, a.Status });
        builder.HasIndex(a => new { a.ScheduledDate, a.OrganizerUserId });
        builder.HasIndex(a => new { a.ScheduledDate, a.ParticipantUserId });

        // Properties
        builder.Property(a => a.SessionSeriesId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .HasMaxLength(2000);

        builder.Property(a => a.ScheduledDate)
            .IsRequired();

        builder.Property(a => a.DurationMinutes)
            .HasDefaultValue(60);

        builder.Property(a => a.SessionNumber)
            .HasDefaultValue(1);

        builder.Property(a => a.OrganizerUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(a => a.ParticipantUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue(SessionAppointmentStatus.Pending);

        builder.Property(a => a.MeetingType)
            .HasMaxLength(100)
            .HasDefaultValue("VideoCall");

        builder.Property(a => a.MeetingLink)
            .HasMaxLength(500);

        builder.Property(a => a.MeetingLocation)
            .HasMaxLength(500);

        builder.Property(a => a.CancellationReason)
            .HasMaxLength(1000);

        builder.Property(a => a.CancelledByUserId)
            .HasMaxLength(450);

        builder.Property(a => a.RescheduleRequestedByUserId)
            .HasMaxLength(450);

        builder.Property(a => a.RescheduleReason)
            .HasMaxLength(1000);

        builder.Property(a => a.NoShowUserIds)
            .HasMaxLength(900);

        builder.Property(a => a.PaymentAmount)
            .HasPrecision(18, 2);

        builder.Property(a => a.Currency)
            .HasMaxLength(10);

        builder.Property(a => a.IsNoShow)
            .HasDefaultValue(false);

        builder.Property(a => a.IsLateCancellation)
            .HasDefaultValue(false);

        builder.Property(a => a.IsPaymentCompleted)
            .HasDefaultValue(false);

        builder.Property(a => a.IsReminder24hSent)
            .HasDefaultValue(false);

        builder.Property(a => a.IsReminder1hSent)
            .HasDefaultValue(false);

        builder.Property(a => a.IsFollowUpSent)
            .HasDefaultValue(false);

        // Soft delete filter
        builder.HasQueryFilter(a => !a.IsDeleted);
    }
}
