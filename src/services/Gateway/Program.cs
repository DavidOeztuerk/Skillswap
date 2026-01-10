using DotNetEnv;
using Gateway.Extensions;
using Infrastructure.Extensions;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

// Load .env file from repo root
Env.Load();

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

var serviceName = "Gateway";
var environment = builder.Environment.EnvironmentName;

// Use environment-specific Ocelot config
var ocelotConfigFile = environment == "Production" || environment == "Staging"
    ? "ocelot.staging.json" // Use staging config for Azure
    : "ocelot.json"; // Use local config for development

builder.Configuration
    .AddJsonFile(ocelotConfigFile, optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// Load credentials from environment variables (Phase 14 security)
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING");
if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Configuration["ConnectionStrings:Redis"] = redisConnectionString;
    builder.Configuration["DistributedRateLimiting:Redis:ConnectionString"] = redisConnectionString;
    Console.WriteLine("[DEBUG] Redis cache configured successfully");
}

// Add shared infrastructure (includes JWT, Swagger, Health Checks, etc.)
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

// Add Ocelot API Gateway
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// Use shared infrastructure middleware pipeline
app.UseSharedInfrastructure(app.Environment, serviceName);

app.UseWebSockets();

// Use Ocelot middleware (must be last)
await app.UseOcelot();

app.Logger.LogInformation("Starting {ServiceName} API Gateway", serviceName);
app.Logger.LogInformation("Using Ocelot configuration: {ConfigFile}", ocelotConfigFile);

app.Run();

public partial class Program { }