using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

var serviceName = "gateway";

// Use environment-specific Ocelot config
var environment = builder.Environment.EnvironmentName;
var ocelotConfigFile = environment == "Production" || environment == "Staging" 
    ? "ocelot.azure.json" 
    : "ocelot.json";

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

builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseSharedInfrastructure();

await app.UseOcelot();

app.Run();
