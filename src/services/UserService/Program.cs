using Microsoft.EntityFrameworkCore;
using MassTransit;
using UserService;
using Events;
using UserService.Models;
using Contracts.Responses;
using UserService.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Contracts.Requests;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Contracts.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IOptions<JwtSettings>>().Value
);

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

builder.Services.AddDbContext<UserDbContext>(opt =>
    opt.UseInMemoryDatabase("InMemoryDb"));

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

app.MapPost("/register", async (UserDbContext dbContext, IPublishEndpoint publisher, IJwtTokenGenerator generator, RegisterRequest request) =>
{
    var user = new User
    {
        Email = request.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
        FirstName = request.FirstName,
        LastName = request.LastName
    };
    dbContext.Users.Add(user);
    await dbContext.SaveChangesAsync();

    await publisher.Publish(new UserRegisteredEvent(user.Email, user.FirstName, user.LastName));

    var token = await generator.GenerateToken(user);
    var response = new RegisterUserResponse(user.Email, user.FirstName, user.LastName, token);
    return Results.Created($"/users/{user.Id}", response);
});

app.MapPost("/login", async (UserDbContext dbContext, IJwtTokenGenerator generator, LoginRequest request) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
    if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }
    var token = await generator.GenerateToken(user);
    var response = new LoginResponse(token);

    return Results.Ok(response);
});

app.MapGet("/profile", async (HttpContext context, UserDbContext dbContext) =>
{
    var userId = ExtractUserIdFromContext(context);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
    return user is not null
        ? Results.Ok(new { user.Email, user.FirstName, user.LastName })
        : Results.NotFound();
})
.RequireAuthorization();

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
