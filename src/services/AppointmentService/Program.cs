using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AppointmentService;
using AppointmentService.Consumer;
using AppointmentService.Models;
using Contracts.Models;
using Contracts.Requests;
using Events;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

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

Console.WriteLine($"ExpireMinutes: {expireMinutes}");

builder.Services.AddDbContext<AppointmentDbContext>(options =>
    options.UseInMemoryDatabase("AppointmentDb"));

// MassTransit + RabbitMQ konfigurieren
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<MatchFoundConsumer>();
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/");
        cfg.ReceiveEndpoint("appointment-match-queue", e =>
        {
            e.ConfigureConsumer<MatchFoundConsumer>(context);
        });
    });
});

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = secret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.ExpireMinutes = expireMinutes;
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
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/appointments/create", async (HttpContext context, AppointmentDbContext dbContext, IPublishEndpoint publisher, CreateAppointmentRequest request) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var appointment = new Appointment
    {
        Title = request.Title,
        Description = request.Description,
        Date = request.Date,
        CreatedBy = userId,
        ParticipantId = request.SkillCreatorId,
        Status = "Pending"
    };

    dbContext.Appointments.Add(appointment);
    await dbContext.SaveChangesAsync();

    await publisher.Publish(new AppointmentCreatedEvent(appointment.Id, appointment.Title, appointment.Description, appointment.Date, appointment.CreatedBy, appointment.ParticipantId));

    return Results.Created($"/appointments/{appointment.Id}", appointment);
}).RequireAuthorization();

// Eigene Termine abrufen
app.MapGet("/appointments", async (HttpContext context, AppointmentDbContext dbContext) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var appointments = await dbContext.Appointments
        .Where(a => a.CreatedBy == userId || a.ParticipantId == userId)
        .ToListAsync();

    return Results.Ok(appointments);
}).RequireAuthorization();

// Termin annehmen oder ablehnen
app.MapPost("/appointments/respond", async (HttpContext context, AppointmentDbContext dbContext, RespondToAppointmentRequest request) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var appointment = await dbContext.Appointments.FindAsync(request.AppointmentId);
    if (appointment == null) return Results.NotFound();

    if (appointment.ParticipantId != userId) return Results.Forbid();

    appointment.Status = request.Accepted ? "Accepted" : "Rejected";
    await dbContext.SaveChangesAsync();

    return Results.Ok();
}).RequireAuthorization();

app.Run();

static string? ExtractUserIdFromContext(HttpContext context)
{
    Console.WriteLine("Authentication Type: " + context.User.Identity?.AuthenticationType);
    Console.WriteLine("Is Authenticated: " + context.User.Identity?.IsAuthenticated);

    Console.WriteLine("\nAll Claims:");
    foreach (var claim in context.User.Claims)
    {
        Console.WriteLine($"Type: {claim.Type}, Value: {claim.Value}");
    }

    // Erweiterte Claim-Suche
    var userId =
        context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
        context.User.FindFirst("sub")?.Value ??
        context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    Console.WriteLine($"\nExtracted User ID: {userId ?? "NULL"}");
    return userId;
}
