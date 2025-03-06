using AppointmentService.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService;

public class AppointmentDbContext(
    DbContextOptions<AppointmentDbContext> options)
    : DbContext(options)
{
    public DbSet<Appointment> Appointments { get; set; }
}
