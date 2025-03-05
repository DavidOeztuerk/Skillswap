using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Contracts.Requests;
using Contracts.Responses;
using Events;
using MassTransit;
using MatchmakingService;
using MatchmakingService.Consumer;
using MatchmakingService.Models;
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

builder.Services.AddDbContext<MatchmakingDbContext>(options =>
    options.UseInMemoryDatabase("MatchmakingDb"));

// MassTransit + RabbitMQ konfigurieren
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<SkillCreatedConsumer>();
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(rabbitHost, "/");
        cfg.ReceiveEndpoint("matchmaking-skill-queue", e =>
        {
            e.ConfigureConsumer<SkillCreatedConsumer>(context);
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

// Endpunkte
app.MapPost("/matches/find", async (HttpContext context, MatchmakingDbContext dbContext, IPublishEndpoint publisher, FindMatchRequest request) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    // Suche nach einem passenden Match
    var potentialMatch = await dbContext.Matches
        .FirstOrDefaultAsync(m => m.SkillName == request.SkillName && !m.IsMatched);
    
    if (potentialMatch != null)
    {
        potentialMatch.IsMatched = true;
        potentialMatch.SkillSearcherId = userId;
        await dbContext.SaveChangesAsync();
        
        await publisher.Publish(new MatchFoundEvent(potentialMatch.Id, potentialMatch.SkillName, potentialMatch.SkillSearcherId, potentialMatch.SkillCreatorId));
        return Results.Ok(new FindMatchResponse(potentialMatch.Id, potentialMatch.SkillName));
    }
    
    // Falls kein Match existiert, neue Anfrage speichern
    var newMatch = new Match { SkillName = request.SkillName, IsMatched = false, SkillSearcherId = userId };
    dbContext.Matches.Add(newMatch);
    await dbContext.SaveChangesAsync();
    
    return Results.Accepted();
}).RequireAuthorization();

app.MapGet("/matches/{matchSessionId}", async (HttpContext context, MatchmakingDbContext dbContext, string matchSessionId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    var match = await dbContext.Matches.FindAsync(matchSessionId);
    if (match == null || (match.SkillSearcherId != userId && match.SkillCreatorId != userId)) return Results.Forbid();
    
    return Results.Ok(match);
}).RequireAuthorization();

app.MapPost("/matches/accept/{matchSessionId}", async (HttpContext context, MatchmakingDbContext dbContext, Guid matchSessionId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    var match = await dbContext.Matches.FindAsync(matchSessionId);
    if (match == null || (match.SkillSearcherId != userId && match.SkillCreatorId != userId)) return Results.Forbid();
    
    match.IsConfirmed = true;
    await dbContext.SaveChangesAsync();
    
    return Results.Ok();
}).RequireAuthorization();

app.MapPost("/matches/reject/{matchSessionId}", async (HttpContext context, MatchmakingDbContext dbContext, Guid matchSessionId) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
    
    var match = await dbContext.Matches.FindAsync(matchSessionId);
    if (match == null || (match.SkillSearcherId != userId && match.SkillCreatorId != userId)) return Results.Forbid();
    
    dbContext.Matches.Remove(match);
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
