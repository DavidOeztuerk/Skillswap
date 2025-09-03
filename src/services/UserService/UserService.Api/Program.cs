using EventSourcing;
using Infrastructure.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Api.Extensions;
using UserService.Infrastructure.Data;
using UserService.Infrastructure.Extensions;

ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] UserService starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(args);

var serviceName = "UserService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

// DB Migration + Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    await strategy.ExecuteAsync(async () =>
    {
        using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            await RbacSeedData.SeedAsync(db);
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

app.MapAuthController();
app.MapUserVerificationController();
app.MapUserProfileController();
app.MapUserSkillsController();
app.MapUserBlockingController();
app.MapUserManagementController();
app.MapTwoFactorController();
app.MapPermissionController();
app.MapAdminEndpoints();

var events = app.MapGroup("/events");
events.MapPost("/replay", ([FromBody] EventReplayService request) =>
    Results.Ok(new { Message = "Event replay initiated" }))
    .WithName("ReplayEvents")
    .WithSummary("Replay domain events")
    .WithTags("Events");

app.Logger.LogInformation("Starting {ServiceName}", serviceName);

app.Run();

public partial class Program { }
