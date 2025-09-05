using Infrastructure.Extensions;
using AppointmentService.Extensions;
using AppointmentService;
using AppointmentService.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "AppointmentService";

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();

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

app.MapApppointmentsController();

app.Logger.LogInformation("Starting {ServiceName} with comprehensive appointment management capabilities", serviceName);

app.Run();

public partial class Program { }