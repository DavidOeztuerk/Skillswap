using System.Text;
using Infrastructure.Models;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace SkillService;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services, IConfiguration configuration)
    {
        var rabbitHost = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq";

        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? configuration["JwtSettings:Secret"]
            ?? throw new InvalidOperationException("JWT Secret nicht konfiguriert");
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? configuration["JwtSettings:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer nicht konfiguriert");
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? configuration["JwtSettings:Audience"]
            ?? throw new InvalidOperationException("JWT Audience nicht konfiguriert");
        var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE")
            ?? configuration["JwtSettings:ExpireMinutes"]
            ?? "60";
        var expireMinutes = int.TryParse(expireString, out var tmp) ? tmp : 60;

        services.AddDbContext<SkillDbContext>(options =>
            options.UseInMemoryDatabase("SkillsInMemoryDb"));

        services.AddMassTransit(x =>
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

        services.Configure<JwtSettings>(options =>
        {
            options.Secret = secret;
            options.Issuer = issuer;
            options.Audience = audience;
            options.ExpireMinutes = expireMinutes;
        });

        services
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

        services.AddAuthorization();

        return services;
    }
}