using StackExchange.Redis;
using Testcontainers.Redis;
using Xunit;

namespace Testing.TestFixtures;

public class RedisFixture : IAsyncLifetime
{
    private RedisContainer? _redisContainer;
    public string ConnectionString { get; private set; } = string.Empty;
    public IConnectionMultiplexer? Connection { get; private set; }

    public async Task InitializeAsync()
    {
        _redisContainer = new RedisBuilder()
            .WithImage("redis:7-alpine")
            .Build();

        await _redisContainer.StartAsync();
        ConnectionString = _redisContainer.GetConnectionString();
        Connection = await ConnectionMultiplexer.ConnectAsync(ConnectionString);
    }

    public async Task DisposeAsync()
    {
        if (Connection != null)
        {
            await Connection.CloseAsync();
            Connection.Dispose();
        }

        if (_redisContainer != null)
        {
            await _redisContainer.StopAsync();
            await _redisContainer.DisposeAsync();
        }
    }

    public IDatabase GetDatabase(int db = -1)
    {
        return Connection?.GetDatabase(db) ?? throw new InvalidOperationException("Redis connection not initialized");
    }

    public async Task FlushDatabaseAsync(int db = -1)
    {
        var server = Connection?.GetServer(Connection.GetEndPoints()[0]);
        if (server != null)
        {
            await server.FlushDatabaseAsync(db);
        }
    }
}

[CollectionDefinition("Redis")]
public class RedisCollection : ICollectionFixture<RedisFixture>
{
}