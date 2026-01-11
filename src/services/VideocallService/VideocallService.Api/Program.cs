using DotNetEnv;
using Infrastructure.Extensions;
using VideocallService.Hubs;
using Microsoft.EntityFrameworkCore;
using VideocallService.Extensions;
using VideocallService.Infrastructure.Extensions;
using VideocallService;
using VideocallService.Infrastructure.Data;

// Load environment-specific .env file
var envName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
var envFile = $".env.{envName.ToLower()}";
if (File.Exists(envFile))
    Env.Load(envFile);
else if (File.Exists(".env"))
    Env.Load(".env");

var builder = WebApplication.CreateBuilder(args);

var serviceName = "VideocallService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VideoCallDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();
    
    await strategy.ExecuteAsync(async () => 
    { 
        await db.Database.MigrateAsync(); 
    });
    
    app.Logger.LogInformation("Database migration completed successfully");
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapVideocallController();

app.UseWebSockets();

// Hub is already mapped in MapVideocallController() at /api/videocall/hub
// app.MapHub<VideoCallHub>("/hubs/videocall"); // REMOVED - avoid duplicate mapping
 // SignalR Hub for real-time video calling
app.MapHub<VideoCallHub>("/api/videocall/hub");

app.Logger.LogInformation("Starting {ServiceName} with real-time video calling capabilities", serviceName);

app.Run();

public partial class Program { }
