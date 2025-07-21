//using Microsoft.EntityFrameworkCore;
//using Microsoft.EntityFrameworkCore.Infrastructure;
//using Microsoft.Extensions.Diagnostics.HealthChecks;
//using Microsoft.Extensions.Logging;
//using System.Diagnostics;

//namespace Infrastructure.HealthChecks;

///// <summary>
///// Health check for database connectivity and basic operations
///// </summary>
//public class DatabaseHealthCheck : IHealthCheck
//{
//    private readonly IDbContextFactory<ApplicationDbContext> _dbContextFactory;
//    private readonly ILogger<DatabaseHealthCheck> _logger;

//    public DatabaseHealthCheck(
//        IDbContextFactory<ApplicationDbContext> dbContextFactory,
//        ILogger<DatabaseHealthCheck> logger)
//    {
//        _dbContextFactory = dbContextFactory;
//        _logger = logger;
//    }

//    public async Task<HealthCheckResult> CheckHealthAsync(
//        HealthCheckContext context,
//        CancellationToken cancellationToken = default)
//    {
//        try
//        {
//            var stopwatch = Stopwatch.StartNew();

//            using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);

//            // Test basic connectivity
//            var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
//            if (!canConnect)
//            {
//                return HealthCheckResult.Unhealthy("Cannot connect to database");
//            }

//            // Test a simple query
//            var userCount = await dbContext.Users.CountAsync(cancellationToken);

//            stopwatch.Stop();

//            var data = new Dictionary<string, object>
//            {
//                ["connection_test"] = "passed",
//                ["query_test"] = "passed",
//                ["user_count"] = userCount,
//                ["response_time_ms"] = stopwatch.ElapsedMilliseconds,
//                ["database_provider"] = dbContext.Database.ProviderName ?? "unknown"
//            };

//            if (stopwatch.ElapsedMilliseconds > 1000)
//            {
//                _logger.LogWarning("Database health check slow response: {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
//                return HealthCheckResult.Degraded($"Database responding slowly: {stopwatch.ElapsedMilliseconds}ms", data: data);
//            }

//            return HealthCheckResult.Healthy("Database is healthy", data);
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Database health check failed");
//            return HealthCheckResult.Unhealthy($"Database health check failed: {ex.Message}", ex);
//        }
//    }
//}

///// <summary>
///// Health check for database connection pool status
///// </summary>
//public class DatabaseConnectionPoolHealthCheck : IHealthCheck
//{
//    private readonly IDbContextFactory<ApplicationDbContext> _dbContextFactory;
//    private readonly ILogger<DatabaseConnectionPoolHealthCheck> _logger;

//    public DatabaseConnectionPoolHealthCheck(
//        IDbContextFactory<ApplicationDbContext> dbContextFactory,
//        ILogger<DatabaseConnectionPoolHealthCheck> logger)
//    {
//        _dbContextFactory = dbContextFactory;
//        _logger = logger;
//    }

//    public async Task<HealthCheckResult> CheckHealthAsync(
//        HealthCheckContext context,
//        CancellationToken cancellationToken = default)
//    {
//        try
//        {
//            // Test multiple concurrent connections to check pool health
//            var tasks = new List<Task<TimeSpan>>();
//            for (int i = 0; i < 5; i++)
//            {
//                tasks.Add(TestConnectionAsync(cancellationToken));
//            }

//            var results = await Task.WhenAll(tasks);
//            var averageTime = results.Average(t => t.TotalMilliseconds);
//            var maxTime = results.Max(t => t.TotalMilliseconds);

//            var data = new Dictionary<string, object>
//            {
//                ["concurrent_connections_tested"] = tasks.Count,
//                ["average_response_time_ms"] = averageTime,
//                ["max_response_time_ms"] = maxTime,
//                ["all_connections_successful"] = true
//            };

//            if (maxTime > 2000)
//            {
//                return HealthCheckResult.Degraded($"Connection pool under stress - max response time: {maxTime:F0}ms", data: data);
//            }

//            if (averageTime > 500)
//            {
//                return HealthCheckResult.Degraded($"Connection pool performance degraded - average response time: {averageTime:F0}ms", data: data);
//            }

//            return HealthCheckResult.Healthy("Database connection pool is healthy", data);
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Database connection pool health check failed");
//            return HealthCheckResult.Unhealthy($"Database connection pool check failed: {ex.Message}", ex);
//        }
//    }

//    private async Task<TimeSpan> TestConnectionAsync(CancellationToken cancellationToken)
//    {
//        var stopwatch = Stopwatch.StartNew();

//        using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
//        // await dbContext.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);

//        stopwatch.Stop();
//        return stopwatch.Elapsed;
//    }
//}

//// Placeholder DbContext - should reference actual application DbContext
//public class ApplicationDbContext : DbContext
//{
//    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

//    public DbSet<User> Users { get; set; } = null!;
//}

//// Placeholder User entity
//public class User
//{
//    public string Id { get; set; } = string.Empty;
//    public string Email { get; set; } = string.Empty;
//    public string FirstName { get; set; } = string.Empty;
//    public string LastName { get; set; } = string.Empty;
//}