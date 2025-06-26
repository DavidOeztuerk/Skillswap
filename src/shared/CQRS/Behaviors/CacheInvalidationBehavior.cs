using CQRS.Interfaces;
using CQRS.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CQRS.Behaviors;

/// <summary>
/// Pipeline behavior that invalidates cache after successful commands
/// </summary>
public class CacheInvalidationBehavior<TRequest, TResponse>(
    ICacheInvalidationService cacheInvalidationService,
    ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICacheInvalidationService _cacheInvalidationService = cacheInvalidationService;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Execute the command/query
        var response = await next();

        // Only invalidate cache for commands, not queries
        if (_cacheInvalidationService != null && request is ICommand)
        {
            await InvalidateCacheBasedOnCommand(request, response, cancellationToken);
        }

        return response;
    }

    private async Task InvalidateCacheBasedOnCommand(TRequest request, TResponse response, CancellationToken cancellationToken)
    {
        var requestType = request.GetType().Name;

        try
        {
            // Check if response indicates success
            var isSuccess = IsSuccessfulResponse(response);
            if (!isSuccess)
            {
                _logger.LogDebug("Skipping cache invalidation for failed command: {CommandType}", requestType);
                return;
            }

            // Pattern matching for different command types
            switch (requestType)
            {
                // User Service Commands
                case "RegisterUserCommand":
                case "UpdateUserProfileCommand":
                case "ChangePasswordCommand":
                case "VerifyEmailCommand":
                    if (request is IAuditableCommand auditableCommand && !string.IsNullOrEmpty(auditableCommand.UserId))
                    {
                        await _cacheInvalidationService.InvalidateUserCacheAsync(auditableCommand.UserId, cancellationToken);
                    }
                    break;

                // Skill Service Commands
                case "CreateSkillCommand":
                case "UpdateSkillCommand":
                case "DeleteSkillCommand":
                    await InvalidateSkillCaches(request, cancellationToken);
                    break;

                case "RateSkillCommand":
                case "EndorseSkillCommand":
                    await InvalidateSkillDetailCaches(request, cancellationToken);
                    break;

                case "CreateSkillCategoryCommand":
                case "UpdateSkillCategoryCommand":
                    await _cacheInvalidationService.InvalidatePatternAsync("skill-categories:*", cancellationToken);
                    break;

                case "CreateProficiencyLevelCommand":
                case "UpdateProficiencyLevelCommand":
                    await _cacheInvalidationService.InvalidatePatternAsync("proficiency-levels:*", cancellationToken);
                    break;

                // Add more command types as needed
                default:
                    _logger.LogDebug("No specific cache invalidation strategy for command: {CommandType}", requestType);
                    break;
            }

            _logger.LogInformation("Cache invalidated for command: {CommandType}", requestType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache for command: {CommandType}", requestType);
            // Don't throw - cache invalidation failure shouldn't fail the command
        }
    }

    private bool IsSuccessfulResponse(TResponse response)
    {
        // Check if response has a Success property
        var successProperty = response?.GetType().GetProperty("Success");
        if (successProperty != null && successProperty.PropertyType == typeof(bool))
        {
            return (bool)(successProperty.GetValue(response) ?? false);
        }

        // If no Success property, assume success if response is not null
        return response != null;
    }

    private async Task InvalidateSkillCaches(TRequest request, CancellationToken cancellationToken)
    {
        // Invalidate skill-specific caches
        var skillIdProperty = request.GetType().GetProperty("SkillId");
        var userIdProperty = request.GetType().GetProperty("UserId");

        if (skillIdProperty != null)
        {
            var skillId = skillIdProperty.GetValue(request)?.ToString();
            if (!string.IsNullOrEmpty(skillId))
            {
                await _cacheInvalidationService.InvalidateEntityCacheAsync("skill", skillId, cancellationToken);
            }
        }

        if (userIdProperty != null)
        {
            var userId = userIdProperty.GetValue(request)?.ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                await _cacheInvalidationService.InvalidatePatternAsync($"user-skills:{userId}*", cancellationToken);
            }
        }

        // Invalidate general skill caches
        await _cacheInvalidationService.InvalidatePatternAsync("skills-search:*", cancellationToken);
        await _cacheInvalidationService.InvalidatePatternAsync("skill-statistics:*", cancellationToken);
        await _cacheInvalidationService.InvalidatePatternAsync("popular-tags:*", cancellationToken);
    }

    private async Task InvalidateSkillDetailCaches(TRequest request, CancellationToken cancellationToken)
    {
        var skillIdProperty = request.GetType().GetProperty("SkillId");
        if (skillIdProperty != null)
        {
            var skillId = skillIdProperty.GetValue(request)?.ToString();
            if (!string.IsNullOrEmpty(skillId))
            {
                await _cacheInvalidationService.InvalidatePatternAsync($"skill-details:{skillId}*", cancellationToken);
                await _cacheInvalidationService.InvalidatePatternAsync($"skill-reviews:{skillId}*", cancellationToken);
            }
        }
    }
}

/// <summary>
/// Interface for commands that should invalidate specific cache keys
/// </summary>
public interface ICacheInvalidatingCommand
{
    string[] GetCacheKeysToInvalidate();
    string[] GetCachePatternsToInvalidate();
}
