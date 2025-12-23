using DotNetEnv;
using Infrastructure.Extensions;
using AppointmentService.Api.Extensions;
using AppointmentService.Infrastructure.Data;
using AppointmentService.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

// Load .env file before anything else
Env.Load();

var builder = WebApplication.CreateBuilder(args);

var serviceName = "AppointmentService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

// Apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();

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

app.MapApppointmentsController();

app.Logger.LogInformation("Starting {ServiceName} with comprehensive appointment management capabilities", serviceName);

app.Run();

public partial class Program { }