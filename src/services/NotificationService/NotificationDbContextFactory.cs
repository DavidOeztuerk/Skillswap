using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NotificationService;

public class NotificationDbContextFactory : IDesignTimeDbContextFactory<NotificationDbContext>
{
    public NotificationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<NotificationDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=skillswap_notifications;Username=skillswap;Password=DohoTyson@1990?!;Port=5432;");

        return new NotificationDbContext(optionsBuilder.Options);
    }
}
