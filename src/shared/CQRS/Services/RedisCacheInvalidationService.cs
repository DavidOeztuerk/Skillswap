using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace CQRS.Services;

public class RedisCacheInvalidationService : ICacheInvalidationService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisCacheInvalidationService> _logger;
    private readonly string _instanceName;

    // In-memory tracking of cache keys per instance
    private readonly ConcurrentDictionary<string, HashSet<string>> _keysByPattern = new();
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public RedisCacheInvalidationService(
        IDistributedCache cache,
        IConnectionMultiplexer? redis,
        ILogger<RedisCacheInvalidationService> logger)
    {
        _cache = cache;
        _redis = redis;
        _logger = logger;
        _instanceName = GetInstanceName();
    }

    public async Task InvalidateAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var fullKey = GetFullKey(key);

            // Remove from distributed cache
            await _cache.RemoveAsync(key, cancellationToken);

            // If Redis is available, ensure it's removed there too
            if (_redis != null)
            {
                var db = _redis.GetDatabase();
                await db.KeyDeleteAsync(fullKey);
            }

            // Remove from tracking
            RemoveFromTracking(key);

            _logger.LogInformation("Invalidated cache key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache key: {Key}", key);
        }
    }

    public async Task InvalidatePatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            var keysToInvalidate = new List<string>();

            // If we have Redis connection, use SCAN for pattern matching
            if (_redis != null)
            {
                keysToInvalidate.AddRange(await ScanRedisKeys(pattern, cancellationToken));
            }
            else
            {
                // Fallback to in-memory tracking
                keysToInvalidate.AddRange(GetTrackedKeysByPattern(pattern));
            }

            // Invalidate all found keys
            var tasks = keysToInvalidate.Select(key => InvalidateAsync(key, cancellationToken));
            await Task.WhenAll(tasks);

            _logger.LogInformation("Invalidated {Count} cache keys matching pattern: {Pattern}",
                keysToInvalidate.Count, pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache pattern: {Pattern}", pattern);
        }
    }

    public async Task InvalidateAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_redis != null)
            {
                // Use Redis FLUSHDB for the current database
                var db = _redis.GetDatabase();
                await db.ExecuteAsync("FLUSHDB", CommandFlags.FireAndForget);
            }
            else
            {
                // Fallback: invalidate all tracked keys
                await _semaphore.WaitAsync(cancellationToken);
                try
                {
                    var allKeys = _keysByPattern.Values.SelectMany(set => set).Distinct().ToList();
                    foreach (var key in allKeys)
                    {
                        await _cache.RemoveAsync(key, cancellationToken);
                    }
                    _keysByPattern.Clear();
                }
                finally
                {
                    _semaphore.Release();
                }
            }

            _logger.LogInformation("Invalidated all cache keys");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating all cache");
        }
    }

    public async Task InvalidateUserCacheAsync(string userId, CancellationToken cancellationToken = default)
    {
        // Define specific keys to invalidate for a user
        var keysToInvalidate = new[]
        {
            $"user-profile:{userId}",
            $"user-roles:{userId}",
            $"user-activity:{userId}",
            $"email-availability:{userId}"
        };

        // Invalidate specific keys
        foreach (var key in keysToInvalidate)
        {
            await InvalidateAsync(key, cancellationToken);
        }

        // Invalidate pattern-based keys
        var patterns = new[]
        {
            $"user-skills:{userId}:*",
            $"skill-recommendations:{userId}:*",
            $"user-activity:{userId}:*"
        };

        foreach (var pattern in patterns)
        {
            await InvalidatePatternAsync(pattern, cancellationToken);
        }
    }

    public async Task InvalidateEntityCacheAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        // Direct invalidation of known keys
        var directKeys = new[]
        {
            $"{entityType}-details:{entityId}",
            $"{entityType}:{entityId}"
        };

        foreach (var key in directKeys)
        {
            await InvalidateAsync(key, cancellationToken);
        }

        // Pattern-based invalidation
        var patterns = new[]
        {
            $"{entityType}-details:{entityId}:*",
            $"{entityType}-reviews:{entityId}:*",
            $"*:{entityType}:{entityId}:*"
        };

        foreach (var pattern in patterns)
        {
            await InvalidatePatternAsync(pattern, cancellationToken);
        }

        // Invalidate list/search caches
        await InvalidateListCaches(entityType, cancellationToken);
    }

    public void TrackKey(string key)
    {
        _semaphore.Wait();
        try
        {
            // Extract patterns from key for easier lookup
            var patterns = ExtractPatterns(key);
            foreach (var pattern in patterns)
            {
                if (!_keysByPattern.ContainsKey(pattern))
                {
                    _keysByPattern[pattern] = new HashSet<string>();
                }
                _keysByPattern[pattern].Add(key);
            }
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private async Task InvalidateListCaches(string entityType, CancellationToken cancellationToken)
    {
        // Common list cache patterns
        var listPatterns = new[]
        {
            $"{entityType}s-search:*",
            $"{entityType}-statistics:*",
            $"{entityType}-list:*",
            $"popular-{entityType}s:*"
        };

        foreach (var pattern in listPatterns)
        {
            await InvalidatePatternAsync(pattern, cancellationToken);
        }
    }

    private async Task<List<string>> ScanRedisKeys(string pattern, CancellationToken cancellationToken)
    {
        await _semaphore.WaitAsync(cancellationToken);

        var keys = new List<string>();

        if (_redis == null) return keys;

        try
        {
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var fullPattern = GetFullKey(pattern);

            // Use SCAN instead of KEYS for better performance
            var scanResult = server.Keys(pattern: fullPattern, pageSize: 100);

            foreach (var key in scanResult)
            {
                // Remove instance prefix to get the original key
                var originalKey = key.ToString().Replace($"{_instanceName}:", "");
                keys.Add(originalKey);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning Redis keys with pattern: {Pattern}", pattern);
        }
        finally
        {
            _semaphore.Release();
        }

        return keys;
    }

    private List<string> GetTrackedKeysByPattern(string pattern)
    {
        var keys = new List<string>();
        var regex = PatternToRegex(pattern);

        _semaphore.Wait();
        try
        {
            foreach (var kvp in _keysByPattern)
            {
                keys.AddRange(kvp.Value.Where(k => regex.IsMatch(k)));
            }
        }
        finally
        {
            _semaphore.Release();
        }

        return keys.Distinct().ToList();
    }

    private void RemoveFromTracking(string key)
    {
        _semaphore.Wait();
        try
        {
            foreach (var kvp in _keysByPattern)
            {
                kvp.Value.Remove(key);
            }
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private List<string> ExtractPatterns(string key)
    {
        var patterns = new List<string>();

        // Extract common patterns from key
        var parts = key.Split(':');
        if (parts.Length > 0)
        {
            // Add the base pattern
            patterns.Add($"{parts[0]}:*");

            // Add more specific patterns
            if (parts.Length > 1)
            {
                patterns.Add($"{parts[0]}:{parts[1]}:*");
            }
        }

        return patterns;
    }

    private System.Text.RegularExpressions.Regex PatternToRegex(string pattern)
    {
        var regexPattern = pattern
            .Replace("*", ".*")
            .Replace("?", ".");
        return new System.Text.RegularExpressions.Regex($"^{regexPattern}$");
    }

    private string GetFullKey(string key)
    {
        return $"{_instanceName}:{key}";
    }

    private string GetInstanceName()
    {
        // Try to get from Redis configuration
        if (_redis != null)
        {
            var config = _redis.Configuration;
            // Extract instance name from configuration if set
            // This is a simplified version - adjust based on your setup
            return "SkillSwap"; // Or extract from assembly name
        }

        return "SkillSwap";
    }
}
