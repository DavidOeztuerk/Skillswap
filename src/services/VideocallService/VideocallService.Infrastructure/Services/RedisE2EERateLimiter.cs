using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using VideocallService.Domain.Services;

namespace VideocallService.Infrastructure.Services;

/// <summary>
/// Redis-based Sliding Window Rate Limiter for E2EE Operations
///
/// Uses Redis Sorted Sets for accurate sliding window rate limiting:
/// - Each operation is stored with its timestamp as score
/// - Old entries are automatically cleaned up
/// - Supports different limits per operation type
/// </summary>
public class RedisE2EERateLimiter : IE2EERateLimiter
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisE2EERateLimiter> _logger;

    private const string KEY_PREFIX = "e2ee:ratelimit:";

    // Rate limit configuration per operation type
    private static readonly Dictionary<string, (int MaxOperations, int WindowSeconds)> RateLimits = new()
    {
        // Key exchange operations are more restricted
        ["KeyOffer"] = (MaxOperations: 10, WindowSeconds: 60),
        ["KeyAnswer"] = (MaxOperations: 10, WindowSeconds: 60),
        ["KeyRotation"] = (MaxOperations: 5, WindowSeconds: 60),
        ["KeyConfirmation"] = (MaxOperations: 20, WindowSeconds: 60),
        ["KeyRejection"] = (MaxOperations: 5, WindowSeconds: 60),

        // Default for unknown types
        ["default"] = (MaxOperations: 10, WindowSeconds: 60)
    };

    public RedisE2EERateLimiter(
        IConnectionMultiplexer redis,
        ILogger<RedisE2EERateLimiter> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    /// <summary>
    /// Check if operation is allowed using sliding window algorithm
    /// </summary>
    public async Task<RateLimitResult> CheckRateLimitAsync(string userId, string operationType)
    {
        var (maxOperations, windowSeconds) = GetLimits(operationType);
        var key = GetKey(userId, operationType);
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (windowSeconds * 1000);

        try
        {
            var db = _redis.GetDatabase();

            // Remove old entries outside the window
            await db.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);

            // Count current entries in window
            var currentCount = await db.SortedSetLengthAsync(key);

            var remaining = Math.Max(0, maxOperations - (int)currentCount);
            var resetIn = windowSeconds; // Simplified - actual reset depends on oldest entry

            if (currentCount < maxOperations)
            {
                return RateLimitResult.Allowed(remaining, (int)currentCount, maxOperations, resetIn);
            }

            // Get the oldest entry to calculate actual reset time
            var oldestEntries = await db.SortedSetRangeByRankWithScoresAsync(key, 0, 0);
            if (oldestEntries.Length > 0)
            {
                var oldestTimestamp = (long)oldestEntries[0].Score;
                var windowEndMs = oldestTimestamp + (windowSeconds * 1000);
                resetIn = Math.Max(1, (int)((windowEndMs - now) / 1000));
            }

            _logger.LogWarning(
                "Rate limit exceeded for user {UserId} on {OperationType}: {Current}/{Max}",
                userId, operationType, currentCount, maxOperations);

            return RateLimitResult.Denied((int)currentCount, maxOperations, resetIn);
        }
        catch (RedisException ex)
        {
            _logger.LogError(ex, "Redis error checking rate limit for {UserId}", userId);
            // Fail open - allow the operation if Redis is unavailable
            return RateLimitResult.Allowed(maxOperations - 1, 0, maxOperations, windowSeconds);
        }
    }

    /// <summary>
    /// Record an operation in the sliding window
    /// </summary>
    public async Task RecordOperationAsync(string userId, string operationType)
    {
        var (_, windowSeconds) = GetLimits(operationType);
        var key = GetKey(userId, operationType);
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        try
        {
            var db = _redis.GetDatabase();

            // Add the operation with current timestamp as score
            // Use timestamp + random component as member to handle duplicates
            var member = $"{now}:{Guid.NewGuid():N}";
            await db.SortedSetAddAsync(key, member, now);

            // Set key expiration to window size + buffer
            await db.KeyExpireAsync(key, TimeSpan.FromSeconds(windowSeconds + 10));

            _logger.LogDebug(
                "Recorded E2EE operation for {UserId}: {OperationType}",
                userId, operationType);
        }
        catch (RedisException ex)
        {
            _logger.LogError(ex, "Redis error recording operation for {UserId}", userId);
            // Don't throw - recording failure shouldn't block the operation
        }
    }

    /// <summary>
    /// Get current rate limit status
    /// </summary>
    public async Task<RateLimitStatus> GetStatusAsync(string userId, string operationType)
    {
        var (maxOperations, windowSeconds) = GetLimits(operationType);
        var key = GetKey(userId, operationType);
        var now = DateTimeOffset.UtcNow;
        var windowStart = now.AddSeconds(-windowSeconds);

        try
        {
            var db = _redis.GetDatabase();

            // Clean up old entries
            var windowStartMs = windowStart.ToUnixTimeMilliseconds();
            await db.SortedSetRemoveRangeByScoreAsync(key, 0, windowStartMs);

            // Get current count
            var currentCount = await db.SortedSetLengthAsync(key);

            return new RateLimitStatus
            {
                CurrentCount = (int)currentCount,
                MaxOperations = maxOperations,
                WindowSizeSeconds = windowSeconds,
                WindowStartTime = windowStart.UtcDateTime,
                WindowEndTime = now.UtcDateTime
            };
        }
        catch (RedisException ex)
        {
            _logger.LogError(ex, "Redis error getting status for {UserId}", userId);
            return new RateLimitStatus
            {
                CurrentCount = 0,
                MaxOperations = maxOperations,
                WindowSizeSeconds = windowSeconds,
                WindowStartTime = windowStart.UtcDateTime,
                WindowEndTime = now.UtcDateTime
            };
        }
    }

    private static string GetKey(string userId, string operationType)
        => $"{KEY_PREFIX}{operationType}:{userId}";

    private static (int MaxOperations, int WindowSeconds) GetLimits(string operationType)
    {
        if (RateLimits.TryGetValue(operationType, out var limits))
        {
            return limits;
        }
        return RateLimits["default"];
    }
}
