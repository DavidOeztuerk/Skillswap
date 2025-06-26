using System.Text.Json;
using CQRS.Interfaces;
using CQRS.Services;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace CQRS.Behaviors;

/// <summary>
/// Enhanced Caching Behavior with Cache Invalidation Tracking
/// </summary>
public class EnhancedCachingBehavior<TRequest, TResponse>(
    IDistributedCache? cache,
    ICacheInvalidationService? cacheInvalidationService,
    ILogger<EnhancedCachingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache? _cache = cache;
    private readonly ICacheInvalidationService? _cacheInvalidationService = cacheInvalidationService;
    private readonly ILogger<EnhancedCachingBehavior<TRequest, TResponse>> _logger = logger;

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

        // Try to get from cache
        var cachedResult = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (cachedResult != null)
        {
            _logger.LogInformation("Cache hit for key {CacheKey}", cacheKey);

            var deserializedResult = JsonSerializer.Deserialize<TResponse>(cachedResult);
            if (deserializedResult != null)
            {
                return deserializedResult;
            }
        }

        _logger.LogInformation("Cache miss for key {CacheKey}", cacheKey);

        // Execute handler and cache result
        var response = await next();

        if (response != null)
        {
            var serializedResult = JsonSerializer.Serialize(response);
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = cacheableQuery.CacheDuration
            };

            await _cache.SetStringAsync(cacheKey, serializedResult, cacheOptions, cancellationToken);

            // Track the key for invalidation
            if (_cacheInvalidationService is CacheInvalidationService service)
            {
                service.TrackKey(cacheKey);
            }

            _logger.LogInformation("Cached result for key {CacheKey} with duration {Duration}",
                cacheKey, cacheableQuery.CacheDuration);
        }

        return response;
    }
}