using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VideocallService;

public class VideocallDbContextFactory : IDesignTimeDbContextFactory<VideoCallDbContext>
{
    public VideoCallDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<VideoCallDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=skillswap_videocalls;Username=skillswap;Password=DohoTyson@1990?!;Port=5432;");

        return new VideoCallDbContext(optionsBuilder.Options);
    }
}
