using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.Text;

namespace Infrastructure.Security;

/// <summary>
/// Extension methods for registering security services
/// </summary>
public static class SecurityExtensions
{
    /// <summary>
    /// Add token revocation services
    /// </summary>
    public static IServiceCollection AddTokenRevocation(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis");
        
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            // Redis-based token revocation
            services.AddSingleton<IConnectionMultiplexer>(provider =>
            {
                var connectionString = configuration.GetConnectionString("Redis")!;
                return ConnectionMultiplexer.Connect(connectionString);
            });
            
            services.AddSingleton<ITokenRevocationService, RedisTokenRevocationService>();
        }
        else
        {
            // Fallback to in-memory
            services.AddSingleton<ITokenRevocationService, InMemoryTokenRevocationService>();
        }

        // Add token revocation middleware
        services.AddTransient<TokenRevocationMiddleware>();
        
        // Add background service for token cleanup
        //services.AddHostedService<TokenCleanupService>();

        return services;
    }

    /// <summary>
    /// Add enhanced JWT authentication with token revocation
    /// </summary>
    public static IServiceCollection AddEnhancedJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtConfig = configuration.GetSection("Jwt");
        var secretKey = jwtConfig["Secret"];
        var issuer = jwtConfig["Issuer"];
        var audience = jwtConfig["Audience"];

        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT Secret is not configured");
        }

        var key = Encoding.UTF8.GetBytes(secretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = true;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5),
                RequireExpirationTime = true,
                RequireSignedTokens = true
            };

            // Enhanced token validation with revocation check
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var tokenRevocationService = context.HttpContext.RequestServices
                        .GetRequiredService<ITokenRevocationService>();

                    var jti = context.Principal?.FindFirst("jti")?.Value;
                    if (!string.IsNullOrEmpty(jti))
                    {
                        var isRevoked = await tokenRevocationService.IsTokenRevokedAsync(jti);
                        if (isRevoked)
                        {
                            context.Fail("Token has been revoked");
                        }
                    }
                },
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<JwtBearerHandler>>();
                    
                    logger.LogWarning("JWT authentication failed: {Error}", context.Exception.Message);
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<JwtBearerHandler>>();
                    
                    logger.LogInformation("JWT challenge triggered for {Path}", context.Request.Path);
                    return Task.CompletedTask;
                }
            };
        });

        return services;
    }

    /// <summary>
    /// Add secure secret management
    /// </summary>
    public static IServiceCollection AddSecretManagement(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register secret manager
        services.AddSingleton<ISecretManager, SecretManager>();
        
        // Configure secret rotation
        var rotationConfig = configuration.GetSection("SecretRotation");
        services.Configure<SecretRotationOptions>(rotationConfig);
        
        // Add secret rotation background service
        services.AddHostedService<SecretRotationService>();

        return services;
    }

    /// <summary>
    /// Add security audit logging
    /// </summary>
    public static IServiceCollection AddSecurityAuditLogging(
        this IServiceCollection services)
    {
        services.AddSingleton<ISecurityAuditLogger, SecurityAuditLogger>();
        // SecurityAuditMiddleware should not be registered as a service
        // It will be used directly via UseMiddleware<SecurityAuditMiddleware>()
        
        return services;
    }

    /// <summary>
    /// Add comprehensive security features
    /// </summary>
    public static IServiceCollection AddComprehensiveSecurity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        return services
            .AddTokenRevocation(configuration)
            .AddEnhancedJwtAuthentication(configuration)
            .AddSecretManagement(configuration)
            .AddSecurityAuditLogging();
    }
}

/// <summary>
/// Secret rotation configuration options
/// </summary>
public class SecretRotationOptions
{
    /// <summary>
    /// Enable automatic secret rotation
    /// </summary>
    public bool EnableRotation { get; set; } = true;

    /// <summary>
    /// Rotation interval in hours
    /// </summary>
    public int RotationIntervalHours { get; set; } = 24 * 7; // Weekly

    /// <summary>
    /// Number of old secrets to keep
    /// </summary>
    public int KeepOldSecretsCount { get; set; } = 3;

    /// <summary>
    /// Secrets to rotate
    /// </summary>
    public List<string> SecretsToRotate { get; set; } = new()
    {
        "JwtSecret",
        "EncryptionKey"
    };
}