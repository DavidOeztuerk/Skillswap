using DotNetEnv;
using Infrastructure.Extensions;
using NotificationService;
using NotificationService.Extensions;
using NotificationService.Hubs;
using Microsoft.EntityFrameworkCore;
using NotificationService.Infrastructure.Extensions;
using NotificationService.Infrastructure.Data;

// Load .env file before anything else
Env.Load();

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

app.MapHub<NotificationHub>("/hubs/notifications");


app.Logger.LogInformation("Starting {ServiceName} with comprehensive notification capabilities", serviceName);

app.Run();

public partial class Program { }
