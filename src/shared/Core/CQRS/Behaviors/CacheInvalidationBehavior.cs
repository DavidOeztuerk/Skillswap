using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using CQRS.Interfaces;
using System.Reflection;
using StackExchange.Redis;

namespace CQRS.Behaviors;

/// <summary>
/// Cache invalidation behavior for commands
/// </summary>
public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IDistributedCache? _cache;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger;

    public CacheInvalidationBehavior(
        IDistributedCache? cache,
        ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger,
        IServiceProvider serviceProvider)
    {
        _cache = cache;
        _logger = logger;
        
        _logger.LogInformation("=== CacheInvalidationBehavior CONSTRUCTOR called for {RequestType} -> {ResponseType} ===", 
            typeof(TRequest).Name, typeof(TResponse).Name);
        
        // Try to get IConnectionMultiplexer from DI if available
        try
        {
            _redis = serviceProvider.GetService<IConnectionMultiplexer>();
            if (_redis != null)
            {
                _logger.LogInformation("Redis connection available for cache invalidation in behavior");
            }
            else
            {
                _logger.LogWarning("Redis connection is NULL in CacheInvalidationBehavior");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis not available, cache invalidation will be limited");
        }
        
        _logger.LogInformation("CacheInvalidationBehavior initialized - Cache: {CacheAvailable}, Redis: {RedisAvailable}", 
            _cache != null, _redis != null);
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("=== CacheInvalidationBehavior.Handle called for {CommandType} ===", typeof(TRequest).Name);
        
        // Check if this is a cache-invalidating command
        var isInvalidatingCommand = request is ICacheInvalidatingCommand;
        _logger.LogInformation("Is {CommandType} an ICacheInvalidatingCommand? {IsInvalidating}", 
            typeof(TRequest).Name, isInvalidatingCommand);
        
        if (_cache == null && _redis == null)
        {
            _logger.LogWarning("No cache or Redis available, skipping cache invalidation");
            return await next(cancellationToken);
        }
        
        if (!isInvalidatingCommand)
        {
            _logger.LogDebug("{CommandType} is not a cache-invalidating command, skipping", typeof(TRequest).Name);
            return await next(cancellationToken);
        }
        
        var invalidatingCommand = (ICacheInvalidatingCommand)request;
        _logger.LogInformation("Processing cache invalidation for {CommandType} with {PatternCount} patterns", 
            typeof(TRequest).Name, invalidatingCommand.InvalidationPatterns?.Length ?? 0);

        // Execute the command
        TResponse response;
        bool success = false;

        try
        {
            _logger.LogInformation("Executing command {CommandType}", typeof(TRequest).Name);
            response = await next(cancellationToken);
            
            // Check if the response indicates success
            success = IsSuccessResponse(response);
            _logger.LogInformation("Command {CommandType} executed, Success: {Success}", typeof(TRequest).Name, success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Command execution failed for {CommandType}", typeof(TRequest).Name);
            throw;
        }

        // Invalidate cache if appropriate
        if (success || !invalidatingCommand.InvalidateOnlyOnSuccess)
        {
            _logger.LogInformation("Starting cache invalidation for {CommandType}", typeof(TRequest).Name);
            await InvalidateCache(invalidatingCommand, request, cancellationToken);
        }
        else
        {
            _logger.LogInformation("Skipping cache invalidation - Success: {Success}, InvalidateOnlyOnSuccess: {InvalidateOnlyOnSuccess}",
                success, invalidatingCommand.InvalidateOnlyOnSuccess);
        }

        return response;
    }

    private async Task InvalidateCache(
        ICacheInvalidatingCommand invalidatingCommand,
        TRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var invalidationTasks = new List<Task>();

            // Invalidate patterns
            if (invalidatingCommand.InvalidationPatterns?.Any() == true)
            {
                foreach (var pattern in invalidatingCommand.InvalidationPatterns)
                {
                    var processedPattern = ProcessPattern(pattern, request);
                    _logger.LogDebug("Invalidating cache pattern: {Pattern}", processedPattern);
                    
                    // Since IDistributedCache doesn't have pattern deletion,
                    // we need to get all keys and delete matching ones
                    // For Redis, we'd need a custom implementation
                    invalidationTasks.Add(RemoveByPatternAsync(processedPattern, cancellationToken));
                }
            }

            // Invalidate specific keys
            if (invalidatingCommand.InvalidationKeys?.Any() == true)
            {
                foreach (var key in invalidatingCommand.InvalidationKeys)
                {
                    var processedKey = ProcessPattern(key, request);
                    _logger.LogDebug("Invalidating cache key: {Key}", processedKey);
                    invalidationTasks.Add(_cache!.RemoveAsync(processedKey, cancellationToken));
                }
            }

            await Task.WhenAll(invalidationTasks);

            _logger.LogInformation(
                "Cache invalidation completed for {CommandType} - Patterns: {PatternCount}, Keys: {KeyCount}",
                typeof(TRequest).Name,
                invalidatingCommand.InvalidationPatterns?.Length ?? 0,
                invalidatingCommand.InvalidationKeys?.Length ?? 0);
        }
        catch (Exception ex)
        {
            // Log but don't fail the command
            _logger.LogError(ex, "Cache invalidation failed for {CommandType}", typeof(TRequest).Name);
        }
    }

    private async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken)
    {
        if (_redis == null)
        {
            _logger.LogWarning("Redis connection not available, cannot invalidate cache by pattern");
            return;
        }

        try
        {
            var serviceName = GetServiceName();
            var fullPattern = $"{serviceName}:{pattern}";
            
            _logger.LogDebug("Removing cache entries matching pattern: {Pattern}", fullPattern);
            
            var database = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints()[0]);
            
            // Use SCAN to find all keys matching the pattern
            var keys = new List<RedisKey>();
            
            // KeysAsync needs database parameter for proper scanning
            await foreach (var key in server.KeysAsync(database: database.Database, pattern: fullPattern))
            {
                keys.Add(key);
                _logger.LogDebug("Found key to delete: {Key}", key);
            }
            
            if (keys.Any())
            {
                // Delete all matching keys
                await database.KeyDeleteAsync(keys.ToArray());
                _logger.LogInformation("Deleted {Count} cache entries matching pattern: {Pattern}", keys.Count, fullPattern);
            }
            else
            {
                _logger.LogDebug("No cache entries found matching pattern: {Pattern}", fullPattern);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache by pattern: {Pattern}", pattern);
        }
    }

    private string ProcessPattern(string pattern, TRequest request)
    {
        var result = pattern;
        var properties = request.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var property in properties)
        {
            var placeholder = $"{{{property.Name}}}";
            if (result.Contains(placeholder))
            {
                var value = property.GetValue(request)?.ToString() ?? "";
                result = result.Replace(placeholder, value, StringComparison.OrdinalIgnoreCase);
            }
        }

        return result;
    }

    private bool IsSuccessResponse(TResponse response)
    {
        if (response == null)
            return false;

        // Check for common success indicators
        var type = response.GetType();
        
        // Check for Success property
        var successProperty = type.GetProperty("Success") ?? type.GetProperty("IsSuccess");
        if (successProperty?.PropertyType == typeof(bool))
        {
            return (bool)(successProperty.GetValue(response) ?? false);
        }

        // Check for Errors property
        var errorsProperty = type.GetProperty("Errors");
        if (errorsProperty != null)
        {
            var errors = errorsProperty.GetValue(response);
            if (errors is IEnumerable<object> errorList)
            {
                return !errorList.Any();
            }
        }

        // Default to true if we can't determine
        return true;
    }

    private string GetServiceName()
    {
        // Get service name from assembly or configuration
        var assembly = Assembly.GetEntryAssembly();
        var assemblyName = assembly?.GetName().Name ?? "UnknownService";

        if (assemblyName.Contains("SkillService")) return "skillservice";
        if (assemblyName.Contains("UserService")) return "userservice";
        if (assemblyName.Contains("NotificationService")) return "notificationservice";
        if (assemblyName.Contains("MatchmakingService")) return "matchmakingservice";
        if (assemblyName.Contains("AppointmentService")) return "appointmentservice";
        if (assemblyName.Contains("VideocallService")) return "videocallservice";

        return assemblyName.ToLower();
    }
}