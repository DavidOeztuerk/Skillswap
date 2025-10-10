using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MatchmakingService;

public class MatchmakingDbContextFactory : IDesignTimeDbContextFactory<MatchmakingDbContext>
{
    public MatchmakingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MatchmakingDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=skillswap_matchmaking;Username=skillswap;Password=DohoTyson@1990?!;Port=5432;");

        return new MatchmakingDbContext(optionsBuilder.Options);
    }
}
