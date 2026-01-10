using DotNetEnv;
using Infrastructure.Extensions;
using SkillService.Extensions;
using SkillService;
using Microsoft.EntityFrameworkCore;
using SkillService.Infrastructure.Data;
using SkillService.Infrastructure.Extensions;
using MediatR;
using SkillService.Application.EventHandlers;
using Events.Integration.UserManagement;

// Load .env file before anything else
Env.Load();

var builder = WebApplication.CreateBuilder(args);

var serviceName = "SkillService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

// Register Application event handlers
builder.Services.AddScoped<INotificationHandler<UserDeletedEvent>, UserDeletedIntegrationEventHandler>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SkillDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => 
    { 
        await db.Database.MigrateAsync(); 
    });

    await strategy.ExecuteAsync(async () =>
    {
        using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            await SkillSeedData.SeedAsync(db);
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    });

    app.Logger.LogInformation("Database migration and seeding completed successfully");
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapSkillController();
// Phase 10: Listing endpoints
app.MapListingController();

app.Logger.LogInformation("Starting {ServiceName} with comprehensive skill management capabilities", serviceName);

app.Run();

public partial class Program { }