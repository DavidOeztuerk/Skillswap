using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text.Json;

// ============================================================================
// PERFORMANCE OPTIMIZATION - Thread Pool Configuration
// ============================================================================
ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);

Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] API Gateway starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================
var serviceName = "gateway";
var environment = builder.Environment.EnvironmentName;

// Use environment-specific Ocelot config
var ocelotConfigFile = environment == "Production" || environment == "Staging"
    ? "ocelot.staging.json" // Use staging config for Azure
    : "ocelot.json"; // Use local config for development

builder.Configuration
    .AddJsonFile(ocelotConfigFile, optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// JWT-Einstellungen aus Configuration (mit Fallback auf ENV)
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST")
    ?? builder.Configuration["RabbitMQ:Host"]
    ?? "localhost";

var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer not configured");

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience not configured");

var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
    ?? builder.Configuration["JwtSettings:ExpireMinutes"]
    ?? "60";

var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowOrigins", policy =>
//     {
//         policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
//     });
// });

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);
builder.Services.AddSkillSwapAuthorization();

// Add permission-based authorization
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options =>
{
    options.AddPermissionPolicies();
});

// ============================================================================
// RATE LIMITING SETUP
// ============================================================================

// Configure rate limiting
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = secret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.ExpireMinutes = expireMinutes;
});


// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;

        // Behalte Original-Claimnamen (kein automatisches Remapping):
        opts.MapInboundClaims = false; // .NET 7/8; für .NET 6: JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero,

            // WICHTIG: passend zu deinem Token:
            NameClaimType = JwtRegisteredClaimNames.Sub, // wenn deine UserId in "sub" steckt
            RoleClaimType = ClaimTypes.Role               // du emitierst ClaimTypes.Role (und zusätzlich "role")
        };

        // Add custom token validation events
        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers.Append("Token-Expired", "true");
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "unauthorized",
                    message = "You are not authorized to access this resource"
                });
                return context.Response.WriteAsync(result);
            }
        };
    });

// ============================================================================
// OCELOT CONFIGURATION
// ============================================================================
builder.Services.AddOcelot(builder.Configuration);

// ============================================================================
// HEALTH CHECKS (BEFORE app.Build())
// ============================================================================
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" });

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

app.UseAuthentication();
app.UseAuthorization();

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================
static Task WriteHealthResponse(HttpContext ctx, HealthReport report)
{
    ctx.Response.ContentType = "application/json";
    var payload = new
    {
        status = report.Status.ToString(),
        timestamp = DateTime.UtcNow,
        durationMs = report.TotalDuration.TotalMilliseconds,
        checks = report.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            durationMs = e.Value.Duration.TotalMilliseconds,
            tags = e.Value.Tags,
            error = e.Value.Exception?.Message
        })
    };
    return ctx.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));
}

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("live"),
    ResponseWriter = WriteHealthResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status200OK
    }
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = WriteHealthResponse
});

// ============================================================================
// OCELOT MIDDLEWARE
// ============================================================================
await app.UseOcelot();

// ============================================================================
// START APPLICATION
// ============================================================================
app.Logger.LogInformation("Starting {ServiceName}", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);
app.Logger.LogInformation("Using Ocelot configuration: {ConfigFile}", ocelotConfigFile);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }