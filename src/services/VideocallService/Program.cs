using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VideocallService;
using VideocallService.Consumer;
using VideocallService.Hubs;

var builder = WebApplication.CreateBuilder(args);

var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST")
    ?? "rabbitmq";
var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? "";
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? "";
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? "";
var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
    ?? builder.Configuration["JwtSettings:ExpireMinutes"]
    ?? "60";
var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

// SignalR & WebSockets aktivieren
builder.Services.AddSignalR();

// Datenbank konfigurieren (InMemory für jetzt)
builder.Services.AddDbContext<VideoCallDbContext>(options =>
    options.UseInMemoryDatabase("VideoCallDb"));

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<AppointmentAcceptedConsumer>();
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });
        cfg.ReceiveEndpoint("videocall-appointment-queue", e =>
        {
            e.ConfigureConsumer<AppointmentAcceptedConsumer>(context);
        });
    });
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secret))
        };
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/videocall"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<VideoCallHub>("/videocall")
    .RequireAuthorization();;

app.Run();
