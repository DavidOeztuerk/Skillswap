using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Reflection;

namespace Infrastructure.Extensions;

/// <summary>
/// Extension methods for messaging configuration (MassTransit + RabbitMQ)
/// </summary>
public static class MessagingExtensions
{
    /// <summary>
    /// Adds MassTransit with RabbitMQ configuration
    /// </summary>
    public static IServiceCollection AddMessaging(
        this IServiceCollection services,
        IConfiguration configuration,
        params Assembly[] consumerAssemblies)
    {
        var rabbitMqSettings = GetRabbitMqSettings(configuration);
        
        services.AddMassTransit(busConfig =>
        {
            // Add consumers from specified assemblies
            foreach (var assembly in consumerAssemblies)
            {
                busConfig.AddConsumers(assembly);
            }
            
            // Configure RabbitMQ
            busConfig.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(rabbitMqSettings.Host, rabbitMqSettings.VirtualHost, h =>
                {
                    h.Username(rabbitMqSettings.Username);
                    h.Password(rabbitMqSettings.Password);
                });
                
                // Configure retry policy
                cfg.UseMessageRetry(r => r.Intervals(
                    TimeSpan.FromSeconds(5),
                    TimeSpan.FromSeconds(10),
                    TimeSpan.FromSeconds(30)));
                
                // Configure error handling (removed deprecated UseInMemoryOutbox)
                
                // Configure endpoints
                cfg.ConfigureEndpoints(context);
                
                // Set prefetch count for better performance
                cfg.PrefetchCount = 16;
                
                // Configure timeout
                cfg.UseTimeout(x => x.Timeout = TimeSpan.FromSeconds(30));
            });
            
            // Configure health checks
            busConfig.ConfigureHealthCheckOptions(opt =>
            {
                opt.Name = "masstransit";
                opt.Tags.Add("ready");
                opt.MinimalFailureStatus = HealthStatus.Unhealthy;
            });
        });
        
        // Note: RabbitMQ health check removed due to version conflicts
        // MassTransit already provides its own health checks
        
        return services;
    }
    
    /// <summary>
    /// Adds event bus abstraction
    /// </summary>
    public static IServiceCollection AddEventBus(this IServiceCollection services)
    {
        services.AddScoped<IEventBus, MassTransitEventBus>();
        return services;
    }
    
    /// <summary>
    /// Gets RabbitMQ settings from configuration
    /// </summary>
    private static RabbitMqSettings GetRabbitMqSettings(IConfiguration configuration)
    {
        var settings = new RabbitMqSettings();
        
        // Try environment variables first
        settings.Host = Environment.GetEnvironmentVariable("RABBITMQ_HOST") 
            ?? configuration["RabbitMQ:Host"] 
            ?? "rabbitmq";
            
        settings.Username = Environment.GetEnvironmentVariable("RABBITMQ_USERNAME")
            ?? configuration["RabbitMQ:Username"]
            ?? "guest";
            
        settings.Password = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD")
            ?? configuration["RabbitMQ:Password"]
            ?? "guest";
            
        settings.VirtualHost = Environment.GetEnvironmentVariable("RABBITMQ_VHOST")
            ?? configuration["RabbitMQ:VirtualHost"]
            ?? "/";
            
        settings.Port = int.TryParse(
            Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? configuration["RabbitMQ:Port"],
            out var port) ? port : 5672;
        
        // Build connection string
        settings.ConnectionString = Environment.GetEnvironmentVariable("RABBITMQ_CONNECTION")
            ?? configuration.GetConnectionString("RabbitMQ")
            ?? $"amqp://{settings.Username}:{settings.Password}@{settings.Host}:{settings.Port}{settings.VirtualHost}";
        
        return settings;
    }
}

/// <summary>
/// RabbitMQ configuration settings
/// </summary>
public class RabbitMqSettings
{
    public string Host { get; set; } = "rabbitmq";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string ConnectionString { get; set; } = string.Empty;
}

/// <summary>
/// Event bus interface for abstraction
/// </summary>
public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) 
        where TEvent : class;
}

/// <summary>
/// MassTransit implementation of event bus
/// </summary>
public class MassTransitEventBus : IEventBus
{
    private readonly IPublishEndpoint _publishEndpoint;
    
    public MassTransitEventBus(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }
    
    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) 
        where TEvent : class
    {
        await _publishEndpoint.Publish(@event, cancellationToken);
    }
}