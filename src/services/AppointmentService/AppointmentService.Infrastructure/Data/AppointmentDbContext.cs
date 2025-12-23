using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Data;

public class AppointmentDbContext(
    DbContextOptions<AppointmentDbContext> options)
    : DbContext(options)
{
    public DbSet<Connection> Connections => Set<Connection>();
    public DbSet<SessionSeries> SessionSeries => Set<SessionSeries>();
    public DbSet<SessionAppointment> SessionAppointments => Set<SessionAppointment>();

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
    }
}
