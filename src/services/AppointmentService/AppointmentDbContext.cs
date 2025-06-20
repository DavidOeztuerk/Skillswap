using AppointmentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService;

public class AppointmentDbContext(
    DbContextOptions<AppointmentDbContext> options)
    : DbContext(options)
{
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrganizerUserId);
            entity.HasIndex(e => e.ParticipantUserId);
            entity.HasIndex(e => e.ScheduledDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.MeetingType);
            entity.HasIndex(e => new { e.ScheduledDate, e.Status });

            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);

            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue(AppointmentStatus.Pending);

            entity.Property(e => e.MeetingType)
                .HasMaxLength(100)
                .HasDefaultValue("VideoCall");

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }
}
