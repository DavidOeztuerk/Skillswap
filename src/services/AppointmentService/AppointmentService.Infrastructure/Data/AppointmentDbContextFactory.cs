using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AppointmentService.Infrastructure.Data;

public class AppointmentDbContextFactory : IDesignTimeDbContextFactory<AppointmentDbContext>
{
    public AppointmentDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppointmentDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=skillswap_appointments;Username=skillswap;Password=DohoTyson@1990?!;Port=5432;");

        return new AppointmentDbContext(optionsBuilder.Options);
    }
}
