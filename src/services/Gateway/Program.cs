using System.Text;
using Infrastructure.Extensions;
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
    ? "ocelot.staging.json" // Use staging config for Azure
    : "ocelot.json"; // Use local config for development

builder.Configuration
    .AddJsonFile(ocelotConfigFile, optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

// JWT-Einstellungen aus ENV oder Configuration
var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? "Skillswap";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? "Skillswap";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Für lokale Tests ausnahmsweise false; in Prod = true
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };
    });

builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// CORS muss als erstes kommen für Preflight requests!
app.UseCors("AllowOrigins");

app.UseSharedInfrastructure();

app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();

app.Run();
