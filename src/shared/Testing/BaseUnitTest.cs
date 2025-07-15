using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Moq;
using Bogus;
using MediatR;
using FluentAssertions;
using Xunit;

namespace Testing;

/// <summary>
/// Base class for unit tests with common setup and utilities
/// </summary>
public abstract class BaseUnitTest : IDisposable
{
    protected readonly Mock<ILogger> MockLogger;
    protected readonly Mock<IMediator> MockMediator;
    protected readonly ServiceProvider ServiceProvider;
    protected readonly Faker Faker;

    protected BaseUnitTest()
    {
        MockLogger = new Mock<ILogger>();
        MockMediator = new Mock<IMediator>();
        Faker = new Faker();

        var services = new ServiceCollection();
        ConfigureServices(services);
        ServiceProvider = services.BuildServiceProvider();
    }

    /// <summary>
    /// Override this method to configure additional services for the test
    /// </summary>
    protected virtual void ConfigureServices(IServiceCollection services)
    {
        services.AddLogging();
        services.AddSingleton(MockMediator.Object);
        
        // Add InMemory database for unit tests
        services.AddDbContext<DbContext>(options =>
        {
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
        });
    }

    /// <summary>
    /// Creates a mock DbContext for testing
    /// </summary>
    protected Mock<TDbContext> CreateMockDbContext<TDbContext>() where TDbContext : DbContext
    {
        var options = new DbContextOptionsBuilder<TDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var mockContext = new Mock<TDbContext>(options);
        return mockContext;
    }

    /// <summary>
    /// Creates an InMemory DbContext for testing
    /// </summary>
    protected TDbContext CreateInMemoryDbContext<TDbContext>() where TDbContext : DbContext
    {
        var options = new DbContextOptionsBuilder<TDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return (TDbContext)Activator.CreateInstance(typeof(TDbContext), options)!;
    }

    public virtual void Dispose()
    {
        ServiceProvider?.Dispose();
        GC.SuppressFinalize(this);
    }
}