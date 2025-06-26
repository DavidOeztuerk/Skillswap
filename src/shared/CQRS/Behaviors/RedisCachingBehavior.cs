using CQRS.Interfaces;
using CQRS.Services;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace CQRS.Behaviors;

/// <summary>
/// Redis-aware caching behavior
/// </summary>
public class RedisCachingBehavior<TRequest, TResponse>(
    IDistributedCache? cache,
    ICacheInvalidationService? cacheInvalidationService,
    ILogger<RedisCachingBehavior<TRequest, TResponse>> logger) 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache? _cache = cache;
    private readonly ICacheInvalidationService? _cacheInvalidationService = cacheInvalidationService;
    private readonly ILogger<RedisCachingBehavior<TRequest, TResponse>> _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Only cache if it's a cacheable query and cache is available
        if (_cache == null || request is not ICacheableQuery cacheableQuery)
        {
            return await next();
        }

        var cacheKey = cacheableQuery.CacheKey;

        try
        {
            // Try to get from cache
            var cachedResult = await _cache.GetStringAsync(cacheKey, cancellationToken);
            if (cachedResult != null)
            {
                _logger.LogInformation("Cache hit for key {CacheKey}", cacheKey);

                var deserializedResult = System.Text.Json.JsonSerializer.Deserialize<TResponse>(cachedResult);
                if (deserializedResult != null)
                {
                    return deserializedResult;
                }
            }
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis error when retrieving cache key {CacheKey}, continuing without cache", cacheKey);
        }

        _logger.LogInformation("Cache miss for key {CacheKey}", cacheKey);

        // Execute handler
        var response = await next();

        // Cache the result
        if (response != null)
        {
            try
            {
                var serializedResult = System.Text.Json.JsonSerializer.Serialize(response);
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = cacheableQuery.CacheDuration
                };

                await _cache.SetStringAsync(cacheKey, serializedResult, cacheOptions, cancellationToken);

                // Track the key for invalidation
                _cacheInvalidationService?.TrackKey(cacheKey);

                _logger.LogInformation("Cached result for key {CacheKey} with duration {Duration}",
                    cacheKey, cacheableQuery.CacheDuration);
            }
            catch (RedisException ex)
            {
                _logger.LogWarning(ex, "Redis error when caching key {CacheKey}, continuing without caching", cacheKey);
            }
        }

        return response;
    }
}