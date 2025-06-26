using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace CQRS.Services;

/// <summary>
/// Memory-only cache invalidation service for non-Redis scenarios
/// </summary>
public class MemoryCacheInvalidationService(
    IDistributedCache cache,
    ILogger<MemoryCacheInvalidationService> logger)
    : ICacheInvalidationService
{
    private readonly IDistributedCache _cache = cache;
    private readonly ILogger<MemoryCacheInvalidationService> _logger = logger;
    private readonly ConcurrentDictionary<string, DateTime> _trackedKeys = new();

    public async Task InvalidateAsync(string key, CancellationToken cancellationToken = default)
    {
        await _cache.RemoveAsync(key, cancellationToken);
        _trackedKeys.TryRemove(key, out _);
        _logger.LogInformation("Invalidated cache key: {Key}", key);
    }

    public async Task InvalidatePatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        var regex = new System.Text.RegularExpressions.Regex(pattern.Replace("*", ".*"));
        var keysToRemove = _trackedKeys.Keys.Where(k => regex.IsMatch(k)).ToList();

        foreach (var key in keysToRemove)
        {
            await InvalidateAsync(key, cancellationToken);
        }

        _logger.LogInformation("Invalidated {Count} cache keys matching pattern: {Pattern}",
            keysToRemove.Count, pattern);
    }

    public async Task InvalidateAllAsync(CancellationToken cancellationToken = default)
    {
        var allKeys = _trackedKeys.Keys.ToList();
        foreach (var key in allKeys)
        {
            await InvalidateAsync(key, cancellationToken);
        }
        _logger.LogInformation("Invalidated all {Count} cache keys", allKeys.Count);
    }

    public async Task InvalidateUserCacheAsync(string userId, CancellationToken cancellationToken = default)
    {
        await InvalidatePatternAsync($"*{userId}*", cancellationToken);
    }

    public async Task InvalidateEntityCacheAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        await InvalidatePatternAsync($"*{entityType}*{entityId}*", cancellationToken);
        await InvalidatePatternAsync($"{entityType}s-*", cancellationToken);
    }

    public void TrackKey(string key)
    {
        _trackedKeys.TryAdd(key, DateTime.UtcNow);
    }
}
