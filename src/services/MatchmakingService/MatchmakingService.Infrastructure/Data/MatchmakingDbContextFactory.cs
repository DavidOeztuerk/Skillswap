using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MatchmakingService.Infrastructure.Data;

public class MatchmakingDbContextFactory : IDesignTimeDbContextFactory<MatchmakingDbContext>
{
    public MatchmakingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MatchmakingDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=MatchmakingDb;Username=postgres;Password=postgres");

        return new MatchmakingDbContext(optionsBuilder.Options);
    }
}
