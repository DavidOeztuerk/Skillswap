using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SkillService;

public class SkillDbContextFactory : IDesignTimeDbContextFactory<SkillDbContext>
{
    public SkillDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SkillDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseNpgsql("Host=localhost;Database=skillswap_skillservice;Username=skillswap;Password=DohoTyson@1990?!;Port=5432;");

        return new SkillDbContext(optionsBuilder.Options);
    }
}
