using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace Testing.TestFixtures;

public class DatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _postgreSqlContainer;
    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        _postgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("testdb")
            .WithUsername("test")
            .WithPassword("test123")
            .Build();

        await _postgreSqlContainer.StartAsync();
        ConnectionString = _postgreSqlContainer.GetConnectionString();
    }

    public async Task DisposeAsync()
    {
        if (_postgreSqlContainer != null)
        {
            await _postgreSqlContainer.StopAsync();
            await _postgreSqlContainer.DisposeAsync();
        }
    }

    public DbContextOptions<TContext> CreateDbContextOptions<TContext>() where TContext : DbContext
    {
        return new DbContextOptionsBuilder<TContext>()
            .UseNpgsql(ConnectionString)
            .Options;
    }

    public async Task<TContext> CreateDbContextAsync<TContext>() where TContext : DbContext
    {
        var options = CreateDbContextOptions<TContext>();
        var context = (TContext)Activator.CreateInstance(typeof(TContext), options)!;
        await context.Database.EnsureCreatedAsync();
        return context;
    }

    public async Task ResetDatabaseAsync<TContext>(TContext context) where TContext : DbContext
    {
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
    }
}

[CollectionDefinition("Database")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>
{
}