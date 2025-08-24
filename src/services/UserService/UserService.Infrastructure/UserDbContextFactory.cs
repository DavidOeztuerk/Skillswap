using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace UserService.Infrastructure;

public class UserDbContextFactory : IDesignTimeDbContextFactory<UserDbContext>
{
    public UserDbContext CreateDbContext(string[] args)
    {
        // Build configuration from appsettings files and environment variables
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<UserDbContext>();
        
        // Get connection string from configuration
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            // Fallback for design-time migrations
            var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "skillswap";
            var username = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
            var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
            
            connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";
        }
        
        Console.WriteLine($"[DEBUG] UserService Design-Time using connection to: {ExtractHostFromConnectionString(connectionString)}");
        
        optionsBuilder.UseNpgsql(connectionString);
        
        return new UserDbContext(optionsBuilder.Options);
    }
    
    private static string ExtractHostFromConnectionString(string connectionString)
    {
        // Extract host for logging without exposing password
        var parts = connectionString.Split(';');
        foreach (var part in parts)
        {
            if (part.StartsWith("Host=", StringComparison.OrdinalIgnoreCase))
            {
                return part;
            }
        }
        return "Unknown Host";
    }
}
