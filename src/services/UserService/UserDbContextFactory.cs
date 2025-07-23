using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace UserService;

/// <summary>
/// Factory für EF Core Design-Time Tools und VS Code Extensions
/// </summary>
public class UserDbContextFactory : IDesignTimeDbContextFactory<UserDbContext>
{
    public UserDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<UserDbContext>();

        // ✅ IMMER localhost für Design-Time Tools (VS Code, EF CLI, etc.)
        var connectionString = "Host=localhost;Database=skillswap;Username=skillswap;Password=skillswap@ditss1990?!;Port=5432;";

        optionsBuilder.UseNpgsql(connectionString);
        optionsBuilder.EnableSensitiveDataLogging();
        optionsBuilder.EnableDetailedErrors();

        Console.WriteLine($"[DEBUG] UserService Design-Time using: Host=localhost;Database=skillswap;Username=skillswap;Password=***;Port=5432;");

        return new UserDbContext(optionsBuilder.Options);
    }
}