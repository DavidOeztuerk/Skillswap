using System.Reflection;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Infrastructure.Middleware;
using CQRS.Extensions;
using EventSourcing;
using Contracts.Appointment.Requests;
using AppointmentService.Extensions;
using System.Security.Claims;
using Infrastructure.Models;
using MediatR;
using AppointmentService;
using AppointmentService.Consumer;
using AppointmentService.Application.Commands;
using AppointmentService.Application.Queries;
using AppointmentService.Application.EventHandlers;
using AppointmentService.Application.Services;
using Events.Domain.Appointment;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "AppointmentService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";

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
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// 2) Service-spezifischer Fallback (nur wenn wirklich nichts gesetzt ist)
if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}
builder.Services.AddDbContext<AppointmentDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)) // EF-Retry einschalten
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event sourcing setup
builder.Services.AddEventSourcing("AppointmentEventStore");

// Add CQRS
var redisConnectionString = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"] ?? throw new InvalidOperationException("Redis connection string not configured");

builder.Services.AddCaching(redisConnectionString).AddCQRS(Assembly.GetExecutingAssembly());

// Add AppointmentService-specific dependencies
builder.Services.AddAppointmentServiceDependencies();

// Add services for appointment data enrichment
builder.Services.AddScoped<AppointmentDataEnrichmentService>();

// Add HttpClients for inter-service communication
builder.Services.AddHttpClient("VideocallService", client =>
{
    client.BaseAddress = new Uri("http://videocallservice:5006");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

builder.Services.AddHttpClient("UserService", client =>
{
    client.BaseAddress = new Uri("http://userservice:5001");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

builder.Services.AddHttpClient("SkillService", client =>
{
    client.BaseAddress = new Uri("http://skillservice:5002");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

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

// Add permission-based authorization
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options =>
{
    options.AddPermissionPolicies();
});

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

// Permission middleware (after authentication/authorization)
app.UsePermissionMiddleware();

// nach app.Build(), vor app.Run():
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
    // EF-eigene ExecutionStrategy, damit auch die Verbindungserstellung retried wird
    var strategy = db.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();           // ← statt EnsureCreated
        // optional: Seeding
        // await AppointmentSeedData.SeedAsync(db);
    });
    app.Logger.LogInformation("Database migration completed successfully");
}

// API Endpoints

// Grouped endpoints for appointments
var appointments = app.MapGroup("/appointments").WithTags("Appointments");

appointments.MapPost("/", HandleCreateAppointment)
    .WithName("CreateAppointment")
    .WithSummary("Create a new appointment")
    .WithDescription("Creates a new appointment for the authenticated user.")
    .RequireAuthorization();

appointments.MapPost("/{appointmentId}/accept", HandleAcceptAppointment)
    .WithName("AcceptAppointment")
    .WithSummary("Accept an appointment")
    .WithDescription("Accepts an appointment for the authenticated user.")
    .RequireAuthorization();

appointments.MapPost("/{appointmentId}/cancel", HandleCancelAppointment)
    .WithName("CancelAppointment")
    .WithSummary("Cancel an appointment")
    .WithDescription("Cancels an appointment for the authenticated user.")
    .RequireAuthorization();

appointments.MapPost("/{appointmentId}/reschedule", HandleRescheduleAppointment)
    .WithName("RescheduleAppointment")
    .WithSummary("Reschedule an appointment")
    .WithDescription("Reschedules an appointment to a new date and time.")
    .RequireAuthorization();

appointments.MapPost("/{appointmentId}/meeting-link", HandleGenerateMeetingLink)
    .WithName("GenerateMeetingLink")
    .WithSummary("Generate meeting link")
    .WithDescription("Generates a meeting link for the appointment with 5-minute activation delay.")
    .RequireAuthorization();

appointments.MapGet("/{appointmentId}", HandleGetAppointmentDetails)
    .WithName("GetAppointmentDetails")
    .WithSummary("Get appointment details")
    .WithDescription("Retrieves details for a specific appointment.");

// Grouped endpoints for user appointments
var myAppointments = app.MapGroup("/my/appointments")
    .WithTags("Appointments");

myAppointments.MapGet("/", HandleGetUserAppointments)
    .WithName("GetMyAppointments")
    .WithSummary("Get my appointments")
    .WithDescription("Retrieves all appointments for the authenticated user.")
    .RequireAuthorization();

// Grouped endpoints for health
var health = app.MapGroup("/health").WithTags("Health");
health.MapGet("/ready", async (AppointmentDbContext dbContext) =>
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
    .WithSummary("Readiness check");

health.MapGet("/live", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
    .WithName("HealthLive")
    .WithSummary("Liveness check");

// ============================================================================
// HANDLER METHODS
// ============================================================================

static async Task<IResult> HandleCreateAppointment(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateAppointmentRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateAppointmentCommand(
        request.Title,
        request.Description,
        request.ScheduledDate,
        request.DurationMinutes,
        request.ParticipantUserId,
        request.SkillId,
        request.MeetingType)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleAcceptAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] AcceptAppointmentRequest? request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new AcceptAppointmentCommand(appointmentId)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleCancelAppointment(IMediator mediator, ClaimsPrincipal user, string appointmentId, [FromBody] CancelAppointmentRequest? request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CancelAppointmentCommand(appointmentId, request?.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleGetAppointmentDetails(IMediator mediator, ClaimsPrincipal user, string appointmentId)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetAppointmentDetailsQuery(appointmentId);
    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleGetUserAppointments(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetUserAppointmentsRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var query = new GetUserAppointmentsQuery(
        userId,
        request.Status,
        request.FromDate,
        request.ToDate,
        request.IncludePast,
        request.PageNumber,
        request.PageSize);

    return await mediator.SendQuery(query);
}

static async Task<IResult> HandleRescheduleAppointment(IMediator mediator, ClaimsPrincipal user, 
    [FromRoute] string appointmentId, [FromBody] RescheduleAppointmentRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new RescheduleAppointmentCommand(
        appointmentId,
        request.NewScheduledDate,
        request.NewDurationMinutes,
        request.Reason)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}

static async Task<IResult> HandleGenerateMeetingLink(IMediator mediator, ClaimsPrincipal user, string appointmentId)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new GenerateMeetingLinkCommand(appointmentId);
    return await mediator.SendCommand(command);
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