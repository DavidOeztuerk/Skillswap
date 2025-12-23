using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Caching;
using Infrastructure.Caching.Http;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class ClearCacheCommandHandler(
    IDistributedCacheService? cacheService,
    IETagGenerator? etagGenerator,
    ILogger<ClearCacheCommandHandler> logger)
    : BaseCommandHandler<ClearCacheCommand, object>(logger)
{
    private readonly IDistributedCacheService? _cacheService = cacheService;
    private readonly IETagGenerator? _etagGenerator = etagGenerator;

    public override async Task<ApiResponse<object>> Handle(
        ClearCacheCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Clearing all caches");

            var results = new ClearCacheResult();

            // Clear CQRS cache patterns
            if (_cacheService != null)
            {
                var cachePatterns = new[]
                {
                    "user-profile:*",
                    "public-profile:*",
                    "user-statistics:*",
                    "favorite-skills:*",
                    "blocked-users:*",
                    "user-availability:*",
                    "skills-search:*",
                    "skill:*",
                    "appointments:*",
                    "matches:*",
                    "notifications:*"
                };

                foreach (var pattern in cachePatterns)
                {
                    try
                    {
                        await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);
                        results.CachePatternsCleared++;
                        Logger.LogDebug("Cleared cache pattern: {Pattern}", pattern);
                    }
                    catch (Exception ex)
                    {
                        Logger.LogWarning(ex, "Failed to clear cache pattern: {Pattern}", pattern);
                        results.Errors.Add($"Failed to clear pattern {pattern}: {ex.Message}");
                    }
                }

                Logger.LogInformation("CQRS cache cleared: {Count} patterns processed", results.CachePatternsCleared);
            }
            else
            {
                Logger.LogWarning("Cache service not available - skipping CQRS cache clear");
                results.Errors.Add("Cache service not available");
            }

            // Clear ETag cache
            if (_etagGenerator != null)
            {
                var etagPatterns = new[]
                {
                    "/api/users*",
                    "/api/skills*",
                    "/api/appointments*",
                    "/api/matchmaking*",
                    "/api/matches*",
                    "/api/videocall*",
                    "/api/notifications*"
                };

                foreach (var pattern in etagPatterns)
                {
                    try
                    {
                        await _etagGenerator.InvalidateETagsByPatternAsync(pattern, cancellationToken);
                        results.ETagPatternsCleared++;
                        Logger.LogDebug("Cleared ETag pattern: {Pattern}", pattern);
                    }
                    catch (Exception ex)
                    {
                        Logger.LogWarning(ex, "Failed to clear ETag pattern: {Pattern}", pattern);
                        results.Errors.Add($"Failed to clear ETag pattern {pattern}: {ex.Message}");
                    }
                }

                Logger.LogInformation("ETag cache cleared: {Count} patterns processed", results.ETagPatternsCleared);
            }
            else
            {
                Logger.LogWarning("ETag generator not available - skipping ETag cache clear");
                results.Errors.Add("ETag generator not available");
            }

            results.Success = results.Errors.Count == 0;
            var message = results.Success
                ? $"Cache cleared successfully: {results.CachePatternsCleared} CQRS patterns, {results.ETagPatternsCleared} ETag patterns"
                : $"Cache partially cleared with {results.Errors.Count} errors";

            Logger.LogInformation(message);

            return Success(results, message);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error clearing cache");
            return Error("Failed to clear cache", ErrorCodes.InternalError);
        }
    }
}

public class ClearCacheResult
{
    public bool Success { get; set; }
    public int CachePatternsCleared { get; set; }
    public int ETagPatternsCleared { get; set; }
    public List<string> Errors { get; set; } = [];
}
