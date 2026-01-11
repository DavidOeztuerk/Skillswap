using DotNetEnv;
using Infrastructure.Extensions;
using NotificationService;
using NotificationService.Extensions;
using NotificationService.Hubs;
using NotificationService.Infrastructure.Hubs;
using NotificationService.Api.Extensions;
using Microsoft.EntityFrameworkCore;
using NotificationService.Infrastructure.Extensions;
using NotificationService.Infrastructure.Data;

// Load environment-specific .env file
var envName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
var envFile = $".env.{envName.ToLower()}";
if (File.Exists(envFile))
    Env.Load(envFile);
else if (File.Exists(".env"))
    Env.Load(".env");

var builder = WebApplication.CreateBuilder(args);

var serviceName = "NotificationService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<NotificationService.Infrastructure.Data.EmailTemplateSeeder>>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    await strategy.ExecuteAsync(async () =>
    {
        var seeder = new NotificationService.Infrastructure.Data.EmailTemplateSeeder(db, logger);
        await seeder.SeedAsync();
    });

    app.Logger.LogInformation("Database migration and email template seeding completed successfully");
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapNotificationController();
app.MapChatController();

app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Logger.LogInformation("Starting {ServiceName} with comprehensive notification capabilities", serviceName);

app.Run();

public partial class Program { }
