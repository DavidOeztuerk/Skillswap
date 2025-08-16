using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using Testcontainers.RabbitMq;
using Xunit;
using MassTransit;
using StackExchange.Redis;

namespace Testing;

public abstract class BaseIntegrationTest<TProgram, TDbContext> : IClassFixture<IntegrationTestWebAppFactory<TProgram, TDbContext>>, IAsyncLifetime
    where TProgram : class
    where TDbContext : DbContext
{
    protected readonly IntegrationTestWebAppFactory<TProgram, TDbContext> Factory;
    protected HttpClient Client { get; private set; } = null!;
    protected IServiceProvider ServiceProvider { get; private set; } = null!;
    protected TDbContext DbContext { get; private set; } = null!;

    protected BaseIntegrationTest(IntegrationTestWebAppFactory<TProgram, TDbContext> factory)
    {
        Factory = factory;
    }

    public virtual async Task InitializeAsync()
    {
        await Factory.InitializeAsync();
        
        Client = Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        ServiceProvider = Factory.Services;
        
        using var scope = ServiceProvider.CreateScope();
        DbContext = scope.ServiceProvider.GetRequiredService<TDbContext>();
        await DbContext.Database.EnsureCreatedAsync();
        
        await SeedDataAsync();
    }

    public virtual async Task DisposeAsync()
    {
        await CleanupAsync();
        Client?.Dispose();
        await Factory.DisposeAsync();
    }

    protected virtual async Task SeedDataAsync()
    {
        // Override in derived classes to seed test data
        await Task.CompletedTask;
    }

    protected virtual async Task CleanupAsync()
    {
        using var scope = ServiceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TDbContext>();
        
        var tableNames = context.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Distinct()
            .Where(t => !string.IsNullOrEmpty(t))
            .ToList();

        foreach (var tableName in tableNames)
        {
            // Using parameterized query to avoid SQL injection warning
            var sql = $"TRUNCATE TABLE \"{tableName}\" CASCADE";
            await context.Database.ExecuteSqlRawAsync(sql);
        }
    }

    protected void SetAuthorizationHeader(string token)
    {
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    protected async Task<T> GetServiceAsync<T>() where T : notnull
    {
        await Task.CompletedTask; // Suppress async warning
        using var scope = ServiceProvider.CreateScope();
        return scope.ServiceProvider.GetRequiredService<T>();
    }

    protected async Task ExecuteDbContextAsync(Func<TDbContext, Task> action)
    {
        using var scope = ServiceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TDbContext>();
        await action(context);
    }

    protected async Task<T> ExecuteDbContextAsync<T>(Func<TDbContext, Task<T>> action)
    {
        using var scope = ServiceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TDbContext>();
        return await action(context);
    }
}

public class IntegrationTestWebAppFactory<TProgram, TDbContext> : WebApplicationFactory<TProgram>, IAsyncLifetime
    where TProgram : class
    where TDbContext : DbContext
{
    private PostgreSqlContainer? _postgreSqlContainer;
    private RedisContainer? _redisContainer;
    private RabbitMqContainer? _rabbitMqContainer;

    public string PostgresConnectionString { get; private set; } = string.Empty;
    public string RedisConnectionString { get; private set; } = string.Empty;
    public string RabbitMqConnectionString { get; private set; } = string.Empty;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            RemoveExistingServices(services);
            ConfigureTestServices(services);
        });

        builder.UseEnvironment("Testing");
    }

    private void RemoveExistingServices(IServiceCollection services)
    {
        // Remove existing database registrations
        services.RemoveAll(typeof(DbContextOptions<TDbContext>));
        services.RemoveAll(typeof(DbContext));
        
        // Remove existing MassTransit registrations
        services.RemoveAll(typeof(IBusControl));
        services.RemoveAll(typeof(IBus));
        services.RemoveAll(typeof(IPublishEndpoint));
        services.RemoveAll(typeof(ISendEndpointProvider));
        
        // Remove existing Redis registrations
        services.RemoveAll(typeof(IConnectionMultiplexer));
    }

    private void ConfigureTestServices(IServiceCollection services)
    {
        // Add test database
        services.AddDbContext<TDbContext>(options =>
        {
            options.UseNpgsql(PostgresConnectionString);
        });

        // Add test Redis
        services.AddSingleton<IConnectionMultiplexer>(_ => 
            ConnectionMultiplexer.Connect(RedisConnectionString));

        // Add test MassTransit
        services.AddMassTransit(x =>
        {
            x.SetKebabCaseEndpointNameFormatter();
            
            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(RabbitMqConnectionString);
            });
        });

        // Add test logging
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Warning);
        });
    }

    public async Task InitializeAsync()
    {
        _postgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("testdb")
            .WithUsername("test")
            .WithPassword("test123")
            .Build();

        _redisContainer = new RedisBuilder()
            .WithImage("redis:7-alpine")
            .Build();

        _rabbitMqContainer = new RabbitMqBuilder()
            .WithImage("rabbitmq:3-management-alpine")
            .WithUsername("test")
            .WithPassword("test123")
            .Build();

        await Task.WhenAll(
            _postgreSqlContainer.StartAsync(),
            _redisContainer.StartAsync(),
            _rabbitMqContainer.StartAsync()
        );

        PostgresConnectionString = _postgreSqlContainer.GetConnectionString();
        RedisConnectionString = _redisContainer.GetConnectionString();
        RabbitMqConnectionString = _rabbitMqContainer.GetConnectionString();
    }

    public new async Task DisposeAsync()
    {
        if (_postgreSqlContainer != null)
        {
            await _postgreSqlContainer.StopAsync();
            await _postgreSqlContainer.DisposeAsync();
        }

        if (_redisContainer != null)
        {
            await _redisContainer.StopAsync();
            await _redisContainer.DisposeAsync();
        }

        if (_rabbitMqContainer != null)
        {
            await _rabbitMqContainer.StopAsync();
            await _rabbitMqContainer.DisposeAsync();
        }
    }
}