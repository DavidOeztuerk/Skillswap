using DotNetEnv;
using MatchmakingService.Extensions;
using MatchmakingService;
using Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Infrastructure.Data;

// Load .env file before anything else
Env.Load();

var builder = WebApplication.CreateBuilder(args);

var serviceName = "MatchmakingService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

// Apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MatchmakingDbContext>();

    try
    {
        // Use MigrateAsync instead of EnsureCreatedAsync to properly handle migrations
        await db.Database.MigrateAsync();
        app.Logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to apply database migrations");
        throw; // Fail fast if migrations fail
    }
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapMatchmakingController();

app.Logger.LogInformation("Starting {ServiceName} with AI-powered matching capabilities", serviceName);

app.Run();

public partial class Program { }