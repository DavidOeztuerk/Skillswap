using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Infrastructure.Middleware;
using CQRS.Extensions;
using EventSourcing;
using AppointmentService.Application.Commands;
using AppointmentService.Application.Queries;
using Infrastructure.Models;
using MediatR;
using AppointmentService;
using AppointmentService.Consumer;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "AppointmentService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

// JWT Configuration
var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret not configured");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer not configured");

var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience not configured");

// Add shared infrastructure
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

// Add database
builder.Services.AddDbContext<AppointmentDbContext>(options =>
{
    options.UseInMemoryDatabase("AppointmentServiceDb");
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

// Event sourcing setup
builder.Services.AddEventSourcing("AppointmentEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? "localhost:6379"; // Default Redis connection string
builder.Services.AddCQRSWithRedis(redisConnectionString, Assembly.GetExecutingAssembly());

// Add MassTransit
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<MatchFoundConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("appointment-match-queue", e =>
        {
            e.ConfigureConsumer<MatchFoundConsumer>(context);
        });
    });
});

// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Add authorization
builder.Services.AddSkillSwapAuthorization();

// Add rate limiting
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));
// builder.Services.AddMemoryCache();

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SkillSwap AppointmentService API",
        Version = "v1",
        Description = "Appointment management service with CQRS architecture"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Use shared infrastructure middleware
app.UseSharedInfrastructure();
app.UseMiddleware<RateLimitingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AppointmentService API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseAuthentication();
app.UseAuthorization();

// API Endpoints
app.MapPost("/appointments", async (IMediator mediator, HttpContext context, CreateAppointmentCommand command) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    command.UserId = userId;
    return await mediator.SendCommand(command);
})
.WithName("CreateAppointment")
.WithSummary("Create a new appointment")
.WithTags("Appointments")
.RequireAuthorization();

app.MapPost("/appointments/{appointmentId}/accept", async (IMediator mediator, HttpContext context, string appointmentId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptAppointmentCommand(appointmentId) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("AcceptAppointment")
.WithSummary("Accept an appointment")
.WithTags("Appointments")
.RequireAuthorization();

app.MapPost("/appointments/{appointmentId}/cancel", async (IMediator mediator, HttpContext context, string appointmentId, string? reason = null) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CancelAppointmentCommand(appointmentId, reason) { UserId = userId };
    return await mediator.SendCommand(command);
})
.WithName("CancelAppointment")
.WithSummary("Cancel an appointment")
.WithTags("Appointments")
.RequireAuthorization();

app.MapGet("/appointments/{appointmentId}", async (IMediator mediator, string appointmentId) =>
{
    var query = new GetAppointmentDetailsQuery(appointmentId);
    return await mediator.SendQuery(query);
})
.WithName("GetAppointmentDetails")
.WithSummary("Get appointment details")
.WithTags("Appointments");

app.MapGet("/my/appointments", async (IMediator mediator, HttpContext context, [AsParameters] GetUserAppointmentsQuery query) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    return await mediator.SendQuery(query);
})
.WithName("GetMyAppointments")
.WithSummary("Get my appointments")
.WithTags("Appointments")
.RequireAuthorization();

// Health checks
app.MapGet("/health/ready", async (AppointmentDbContext dbContext) =>
{
    try
    {
        await dbContext.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Health check failed: {ex.Message}");
    }
})
.WithName("HealthReady")
.WithTags("Health");

app.MapGet("/health/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
.WithName("HealthLive")
.WithTags("Health");

// Helper method
static string? ExtractUserIdFromContext(HttpContext context)
{
    return context.User.FindFirst("user_id")?.Value
           ?? context.User.FindFirst("sub")?.Value
           ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        app.Logger.LogInformation("AppointmentService database initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error occurred while initializing AppointmentService database");
    }
}

app.Logger.LogInformation("Starting {ServiceName} with comprehensive appointment management", serviceName);
app.Run();