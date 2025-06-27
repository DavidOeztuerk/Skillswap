using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using CQRS.Interfaces;
using System.Text.Json;

namespace CQRS.Behaviors;

/// <summary>
/// Caching behavior for queries
/// </summary>
/// <typeparam name="TRequest"></typeparam>
/// <typeparam name="TResponse"></typeparam>
public class CachingBehavior<TRequest, TResponse>(
    IDistributedCache? cache,
    ILogger<CachingBehavior<TRequest, TResponse>> logger) 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache? _cache = cache;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Only cache if it's a cacheable query and cache is available
        if (_cache == null || request is not ICacheableQuery cacheableQuery)
        {
            return await next(cancellationToken);
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
        var response = await next(cancellationToken);

        if (response != null)
        {
            var serializedResult = JsonSerializer.Serialize(response);
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = cacheableQuery.CacheDuration
            };

            await _cache.SetStringAsync(cacheKey, serializedResult, cacheOptions, cancellationToken);

            _logger.LogInformation("Cached result for key {CacheKey} with duration {Duration}",
                cacheKey, cacheableQuery.CacheDuration);
        }

        return response;
    }
}
