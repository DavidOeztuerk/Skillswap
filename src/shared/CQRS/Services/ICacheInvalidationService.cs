namespace CQRS.Services;

/// <summary>
/// Service for cache invalidation strategies
/// </summary>
public interface ICacheInvalidationService
{
    Task InvalidateAsync(string key, CancellationToken cancellationToken = default);
    Task InvalidatePatternAsync(string pattern, CancellationToken cancellationToken = default);
    Task InvalidateAllAsync(CancellationToken cancellationToken = default);
    Task InvalidateUserCacheAsync(string userId, CancellationToken cancellationToken = default);
    Task InvalidateEntityCacheAsync(string entityType, string entityId, CancellationToken cancellationToken = default);
    void TrackKey(string key);
}
