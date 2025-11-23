using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Data;

public class AppointmentDbContext(
    DbContextOptions<AppointmentDbContext> options)
    : DbContext(options)
{
    // Legacy table (will be migrated to SessionAppointments)
    public DbSet<Appointment> Appointments => Set<Appointment>();

    // New 3-tier hierarchy
    public DbSet<Connection> Connections => Set<Connection>();
    public DbSet<SessionSeries> SessionSeries => Set<SessionSeries>();
    public DbSet<SessionAppointment> SessionAppointments => Set<SessionAppointment>();

    // Phase 2.1: Session lifecycle (rating, payment)
    public DbSet<SessionRating> SessionRatings => Set<SessionRating>();
    public DbSet<SessionPayment> SessionPayments => Set<SessionPayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply new entity configurations
        modelBuilder.ApplyConfiguration(new ConnectionConfiguration());
        modelBuilder.ApplyConfiguration(new SessionSeriesConfiguration());
        modelBuilder.ApplyConfiguration(new SessionAppointmentConfiguration());
        modelBuilder.ApplyConfiguration(new SessionRatingConfiguration());
        modelBuilder.ApplyConfiguration(new SessionPaymentConfiguration());

        // Legacy Appointment configuration (for backward compatibility during migration)
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
