using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace CQRS.Services;

public class CacheInvalidationService(
    IDistributedCache cache,
    ILogger<CacheInvalidationService> logger)
    : ICacheInvalidationService
{
    private readonly IDistributedCache _cache = cache;
    private readonly ILogger<CacheInvalidationService> _logger = logger;
    private readonly HashSet<string> _trackedKeys = new();
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task InvalidateAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
            _logger.LogInformation("Invalidated cache key: {Key}", key);

            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                _trackedKeys.Remove(key);
            }
            finally
            {
                _semaphore.Release();
            }
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
            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                var regex = new Regex(pattern.Replace("*", ".*"));
                var keysToRemove = _trackedKeys.Where(k => regex.IsMatch(k)).ToList();

                foreach (var key in keysToRemove)
                {
                    await _cache.RemoveAsync(key, cancellationToken);
                    _trackedKeys.Remove(key);
                }

                _logger.LogInformation("Invalidated {Count} cache keys matching pattern: {Pattern}",
                    keysToRemove.Count, pattern);
            }
            finally
            {
                _semaphore.Release();
            }
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
            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                foreach (var key in _trackedKeys.ToList())
                {
                    await _cache.RemoveAsync(key, cancellationToken);
                }
                _trackedKeys.Clear();

                _logger.LogInformation("Invalidated all cache keys");
            }
            finally
            {
                _semaphore.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating all cache");
        }
    }

    public async Task InvalidateUserCacheAsync(string userId, CancellationToken cancellationToken = default)
    {
        // Invalidate all cache keys related to a specific user
        var patterns = new[]
        {
            $"user-profile:{userId}",
            $"user-skills:{userId}*",
            $"user-roles:{userId}",
            $"user-email:{userId}",
            $"skill-recommendations:{userId}*",
            $"user-activity:{userId}*"
        };

        foreach (var pattern in patterns)
        {
            await InvalidatePatternAsync(pattern, cancellationToken);
        }
    }

    public async Task InvalidateEntityCacheAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        // Invalidate all cache keys related to a specific entity
        var patterns = new[]
        {
            $"{entityType}-details:{entityId}*",
            $"{entityType}-{entityId}:*",
            $"*:{entityType}:{entityId}*"
        };

        foreach (var pattern in patterns)
        {
            await InvalidatePatternAsync(pattern, cancellationToken);
        }

        // Also invalidate list/search caches that might contain this entity
        await InvalidatePatternAsync($"{entityType}s-*", cancellationToken);
        await InvalidatePatternAsync($"{entityType}-search:*", cancellationToken);
        await InvalidatePatternAsync($"{entityType}-statistics:*", cancellationToken);
    }

    public void TrackKey(string key)
    {
        _semaphore.Wait();
        try
        {
            _trackedKeys.Add(key);
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
