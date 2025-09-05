using MatchmakingService.Extensions;
using MatchmakingService;
using Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "MatchmakingService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MatchmakingDbContext>();
    
    try
    {
        await db.Database.EnsureCreatedAsync();
        app.Logger.LogInformation("Database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database initialization warning (likely already exists), continuing...");
    }
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapMatchmakingController();

app.Logger.LogInformation("Starting {ServiceName} with AI-powered matching capabilities", serviceName);

app.Run();

public partial class Program { }