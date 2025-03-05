using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

builder.Configuration
    .AddJsonFile("ocelot.json",
        optional: false,
        reloadOnChange: true)
    .AddEnvironmentVariables();

// Lies die JWT-Einstellungen
var secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "";
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;  // Für lokale Tests
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secret))
        };
    });

// Ocelot einbinden
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Ocelot Middleware
await app.UseOcelot();

app.Run();
