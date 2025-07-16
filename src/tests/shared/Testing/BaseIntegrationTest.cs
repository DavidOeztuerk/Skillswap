using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using Testcontainers.RabbitMq;
using Xunit;
using System.Data.Common;

namespace Testing;

/// <summary>
/// Base class for integration tests that sets up TestContainers for PostgreSQL, Redis, and RabbitMQ
/// </summary>
/// <typeparam name="TProgram">The Program class of the service being tested</typeparam>
/// <typeparam name="TDbContext">The DbContext of the service being tested</typeparam>
public abstract class BaseIntegrationTest<TProgram, TDbContext> : IClassFixture<IntegrationTestWebAppFactory<TProgram, TDbContext>>, IAsyncLifetime
    where TProgram : class
    where TDbContext : DbContext
{
    protected readonly IntegrationTestWebAppFactory<TProgram, TDbContext> Factory;
    protected readonly HttpClient Client;
    protected readonly IServiceScope Scope;
    protected readonly TDbContext DbContext;

    protected BaseIntegrationTest(IntegrationTestWebAppFactory<TProgram, TDbContext> factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
        Scope = factory.Services.CreateScope();
        DbContext = Scope.ServiceProvider.GetRequiredService<TDbContext>();
    }

    public virtual async Task InitializeAsync()
    {
        await Factory.InitializeAsync();
        await DbContext.Database.EnsureCreatedAsync();
    }

    public virtual async Task DisposeAsync()
    {
        await DbContext.Database.EnsureDeletedAsync();
        Scope.Dispose();
        Client.Dispose();
    }

    /// <summary>
    /// Seeds the database with test data
    /// </summary>
    protected virtual async Task SeedAsync()
    {
        // Override in derived classes to seed specific test data
    }

    /// <summary>
    /// Cleans up the database after tests
    /// </summary>
    protected virtual async Task CleanupAsync()
    {
        // Clear all data from tables
        var tableNames = DbContext.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Distinct()
            .ToList();

        foreach (var tableName in tableNames)
        {
            await DbContext.Database.ExecuteSqlRawAsync($"DELETE FROM \"{tableName}\"");
        }
    }
}

/// <summary>
/// Custom WebApplicationFactory for integration tests with TestContainers
/// </summary>
/// <typeparam name="TProgram">The Program class of the service being tested</typeparam>
/// <typeparam name="TDbContext">The DbContext of the service being tested</typeparam>
public class IntegrationTestWebAppFactory<TProgram, TDbContext> : WebApplicationFactory<TProgram>, IAsyncLifetime
    where TProgram : class
    where TDbContext : DbContext
{
    private readonly PostgreSqlContainer _postgreSqlContainer;
    private readonly RedisContainer _redisContainer;
    private readonly RabbitMqContainer _rabbitMqContainer;

    public IntegrationTestWebAppFactory()
    {
        _postgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithDatabase("skillswap_test")
            .WithUsername("test")
            .WithPassword("test")
            .Build();

        _redisContainer = new RedisBuilder()
            .WithImage("redis:7-alpine")
            .Build();

        _rabbitMqContainer = new RabbitMqBuilder()
            .WithImage("rabbitmq:3-management")
            .WithUsername("test")
            .WithPassword("test")
            .Build();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<TDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add test database
            services.AddDbContext<TDbContext>(options =>
            {
                options.UseNpgsql(_postgreSqlContainer.GetConnectionString());
            });

            // Configure test Redis
            services.AddSingleton(sp =>
            {
                var multiplexer = StackExchange.Redis.ConnectionMultiplexer.Connect(_redisContainer.GetConnectionString());
                return multiplexer;
            });

            // Configure test RabbitMQ
            services.Configure<MassTransit.RabbitMqTransportOptions>(options =>
            {
                options.Host = _rabbitMqContainer.Hostname;
                options.Port = _rabbitMqContainer.GetMappedPublicPort(5672);
                options.Username = "test";
                options.Password = "test";
            });
        });

        builder.UseEnvironment("Test");
    }

    public async Task InitializeAsync()
    {
        await _postgreSqlContainer.StartAsync();
        await _redisContainer.StartAsync();
        await _rabbitMqContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgreSqlContainer.DisposeAsync();
        await _redisContainer.DisposeAsync();
        await _rabbitMqContainer.DisposeAsync();
    }
}