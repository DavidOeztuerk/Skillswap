using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Contracts.Models;
using Contracts.Requests;
using Contracts.Responses;
using Events;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SkillService;
using SkillService.Models;

var builder = WebApplication.CreateBuilder(args);

var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException("JWT Secret nicht konfiguriert");
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer nicht konfiguriert");
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JWT Audience nicht konfiguriert");
var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
    ?? builder.Configuration["JwtSettings:ExpireMinutes"]
    ?? "60";
var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

builder.Services.AddDbContext<SkillDbContext>(options =>
    options.UseInMemoryDatabase("SkillsInMemoryDb"));

builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
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

app.MapGet("/skills", async (SkillDbContext db) =>
{
    return await db.Skills.ToListAsync();
});

app.MapGet("/skills/user", async (HttpContext context, SkillDbContext db) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var userSkills = await db.Skills.Where(x => x.UserId == userId).ToListAsync();
    return Results.Ok(userSkills);
}).RequireAuthorization();


app.MapPost("/skills", async (HttpContext context, SkillDbContext dbContext, IPublishEndpoint publisher, CreateSkillRequest request) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var skill = new Skill
    {
        UserId = userId,
        Name = request.Name,
        Description = request.Description,
        IsOffering = request.IsOffering,
    };

    dbContext.Skills.Add(skill);
    await dbContext.SaveChangesAsync();
    await publisher.Publish(new SkillCreatedEvent(skill.Id, skill.Name, skill.Description, skill.IsOffering, userId));

    return Results.Created($"/skills/{skill.Id}", new CreateSkillResponse(skill.Id, skill.Name, skill.Description, skill.IsOffering));
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
