using System.Reflection;
using System.Text;
using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RabbitMQ.Client;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Security;
using Infrastructure.Middleware;
using Infrastructure.Models;
using CQRS.Extensions;
using EventSourcing;
using Contracts.Appointment.Requests;
using AppointmentService.Extensions;
using System.Security.Claims;
using MediatR;
using AppointmentService;
using AppointmentService.Consumer;
using AppointmentService.Application.Commands;
using AppointmentService.Application.Queries;
using AppointmentService.Application.Services;
using Microsoft.AspNetCore.Mvc;

// ============================================================================
// PERFORMANCE OPTIMIZATION - Thread Pool Configuration
// ============================================================================
ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);
AppContext.SetSwitch("System.Runtime.ServerGarbageCollection", true);

Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] AppointmentService starting...");
Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Thread Pool - Min Threads: 200, Max Threads: 1000");

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================
var serviceName = "AppointmentService";
var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST")
    ?? builder.Configuration["RabbitMQ:Host"]
    ?? "rabbitmq";

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

// ============================================================================
// SHARED INFRASTRUCTURE & HTTP CLIENTS
// ============================================================================
builder.Services.AddSharedInfrastructure(builder.Configuration, builder.Environment, serviceName);

builder.Services.AddHttpClient("VideocallService", client =>
{
    client.BaseAddress = new Uri("http://videocallservice:5006");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("UserService", client =>
{
    client.BaseAddress = new Uri("http://userservice:5001");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("SkillService", client =>
{
    client.BaseAddress = new Uri("http://skillservice:5002");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ============================================================================
// DATABASE SETUP
// ============================================================================
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    var pgUser = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "skillswap";
    var pgPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
        ?? throw new InvalidOperationException("POSTGRES_PASSWORD environment variable is required");
    connectionString =
        $"Host=postgres_userservice;Database=userservice;Username={pgUser};Password={pgPass};Port=5432;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AppointmentDbContext>(opts =>
    opts.UseNpgsql(connectionString, npg =>
        npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null))
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Event Sourcing
builder.Services.AddEventSourcing("AppointmentEventStore");

// ============================================================================
// CQRS & CACHING
// ============================================================================
var redisConnectionString =
    Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? builder.Configuration["ConnectionStrings:Redis"]
    ?? builder.Configuration["Redis:ConnectionString"]
    ?? "redis:6379";

builder.Services
    .AddCaching(redisConnectionString)
    .AddCQRS(Assembly.GetExecutingAssembly());

// Add AppointmentService-specific dependencies
builder.Services.AddAppointmentServiceDependencies();
builder.Services.AddScoped<AppointmentDataEnrichmentService>();

// ============================================================================
// MESSAGE BUS (MassTransit + RabbitMQ)
// ============================================================================
var rabbitMqConnection =
    Environment.GetEnvironmentVariable("RABBITMQ_CONNECTION")
    ?? builder.Configuration.GetConnectionString("RabbitMQ")
    ?? $"amqp://guest:guest@{rabbitHost}:5672";

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

        cfg.ConfigureEndpoints(context);
    });

    x.ConfigureHealthCheckOptions(opt =>
    {
        opt.Name = "masstransit";
        opt.Tags.Add("ready");
        opt.MinimalFailureStatus = HealthStatus.Unhealthy;
    });
});

// ============================================================================
// AUTHN / AUTHZ
// ============================================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.MapInboundClaims = false;

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

        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception is SecurityTokenExpiredException)
                    context.Response.Headers.Append("Token-Expired", "true");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new { error = "unauthorized", message = "You are not authorized to access this resource" });
                return context.Response.WriteAsync(result);
            }
        };
    });

builder.Services.AddSkillSwapAuthorization();
builder.Services.AddPermissionAuthorization();
builder.Services.AddAuthorization(options => options.AddPermissionPolicies());

// ============================================================================
// RATE LIMITING
// ============================================================================
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

// ============================================================================
// SWAGGER
// ============================================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SkillSwap AppointmentService API",
        Version = "v1",
        Description = "Appointment management service with CQRS architecture"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================================================
// HEALTH CHECKS (BEFORE app.Build())
// ============================================================================
var rabbitConn = new Lazy<Task<IConnection>>(() =>
{
    var factory = new ConnectionFactory { Uri = new Uri(rabbitMqConnection) };
    return factory.CreateConnectionAsync();
});

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
    .AddDbContextCheck<AppointmentDbContext>(name: "postgresql", tags: new[] { "ready", "db" })
    .AddRedis(redisConnectionString, name: "redis", tags: new[] { "ready", "cache" }, timeout: TimeSpan.FromSeconds(2))
    .AddRabbitMQ(sp => rabbitConn.Value, name: "rabbitmq", tags: new[] { "ready", "messaging" }, timeout: TimeSpan.FromSeconds(2));

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

// DB Migration + Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () => { await db.Database.MigrateAsync(); });

    app.Logger.LogInformation("Database migration completed successfully");
}

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================
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
app.UsePermissionMiddleware();

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

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
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

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
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

app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = WriteHealthResponse
});

// ============================================================================
// ENDPOINT MAPPINGS
// ============================================================================

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

// ============================================================================
// START APPLICATION
// ============================================================================
app.Logger.LogInformation("Starting {ServiceName}", serviceName);
app.Logger.LogInformation("JWT Configuration: Issuer={Issuer}, Audience={Audience}, Expiry={Expiry}min",
    issuer, audience, expireMinutes);

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }