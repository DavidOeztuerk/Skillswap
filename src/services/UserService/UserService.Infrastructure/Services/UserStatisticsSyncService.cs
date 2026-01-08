using Infrastructure.Communication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;

namespace UserService.Infrastructure.Services;

/// <summary>
/// Service for synchronizing and recalculating user statistics.
/// Used for initial data population and periodic reconciliation.
/// </summary>
public interface IUserStatisticsSyncService
{
    /// <summary>
    /// Synchronize statistics for a single user
    /// </summary>
    Task SyncUserStatisticsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronize statistics for all users (batch operation)
    /// </summary>
    Task SyncAllUserStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Recalculate experience statistics from UserExperience entries
    /// </summary>
    Task RecalculateExperienceAsync(string userId, CancellationToken cancellationToken = default);
}

public class UserStatisticsSyncService : IUserStatisticsSyncService
{
    private readonly UserDbContext _dbContext;
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<UserStatisticsSyncService> _logger;

    public UserStatisticsSyncService(
        UserDbContext dbContext,
        IServiceCommunicationManager serviceCommunication,
        ILogger<UserStatisticsSyncService> logger)
    {
        _dbContext = dbContext;
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task SyncUserStatisticsAsync(string userId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[UserStatisticsSync] Starting sync for user {UserId}", userId);

        var user = await _dbContext.Users
            .Include(u => u.Experiences)
            .Include(u => u.Statistics)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("[UserStatisticsSync] User {UserId} not found", userId);
            return;
        }

        var statistics = user.Statistics ?? UserStatistics.CreateForUser(userId, user.CreatedAt);

        if (user.Statistics == null)
        {
            _dbContext.UserStatistics.Add(statistics);
        }

        // Recalculate experience from local data
        statistics.RecalculateExperience(user.Experiences);

        // Get skill counts from SkillService
        await SyncSkillCountsAsync(userId, statistics, cancellationToken);

        // Get review counts from local UserReviews
        await SyncReviewStatsAsync(userId, statistics, cancellationToken);

        statistics.LastCalculatedAt = DateTime.UtcNow;
        statistics.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "[UserStatisticsSync] Completed sync for user {UserId}: Experience={ExpMonths}mo, Skills={Offered}/{Wanted}",
            userId, statistics.TotalExperienceMonths, statistics.SkillsOfferedCount, statistics.SkillsWantedCount);
    }

    public async Task SyncAllUserStatisticsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[UserStatisticsSync] Starting full sync for all users");

        var userIds = await _dbContext.Users
            .Where(u => u.IsActive)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("[UserStatisticsSync] Found {Count} active users to sync", userIds.Count);

        var successCount = 0;
        var errorCount = 0;

        foreach (var userId in userIds)
        {
            try
            {
                await SyncUserStatisticsAsync(userId, cancellationToken);
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UserStatisticsSync] Error syncing user {UserId}", userId);
                errorCount++;
            }
        }

        _logger.LogInformation(
            "[UserStatisticsSync] Completed full sync: {Success} succeeded, {Errors} failed",
            successCount, errorCount);
    }

    public async Task RecalculateExperienceAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.Experiences)
            .Include(u => u.Statistics)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("[UserStatisticsSync] User {UserId} not found", userId);
            return;
        }

        var statistics = user.Statistics;
        if (statistics == null)
        {
            statistics = UserStatistics.CreateForUser(userId, user.CreatedAt);
            _dbContext.UserStatistics.Add(statistics);
        }

        statistics.RecalculateExperience(user.Experiences);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "[UserStatisticsSync] Recalculated experience for user {UserId}: {Months} months",
            userId, statistics.TotalExperienceMonths);
    }

    private async Task SyncSkillCountsAsync(
        string userId,
        UserStatistics statistics,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get skill counts from SkillService
            var skillStats = await _serviceCommunication.GetAsync<SkillCountResponse>(
                "skillservice",
                $"api/skills/user/{userId}/counts",
                cancellationToken);

            if (skillStats != null)
            {
                statistics.SkillsOfferedCount = skillStats.OfferedCount;
                statistics.SkillsWantedCount = skillStats.WantedCount;
                statistics.TotalEndorsementsReceived = skillStats.TotalEndorsements;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[UserStatisticsSync] Failed to get skill counts for user {UserId}", userId);
        }
    }

    private async Task SyncReviewStatsAsync(
        string userId,
        UserStatistics statistics,
        CancellationToken cancellationToken)
    {
        // Get review counts from local UserReviews table
        var reviewStats = await _dbContext.UserReviews
            .Where(r => r.RevieweeId == userId)
            .GroupBy(r => 1)
            .Select(g => new
            {
                Count = g.Count(),
                AverageRating = g.Average(r => r.Rating)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (reviewStats != null)
        {
            statistics.ReviewsReceivedCount = reviewStats.Count;
            statistics.AverageRating = reviewStats.AverageRating;
        }

        // Count reviews given
        statistics.ReviewsGivenCount = await _dbContext.UserReviews
            .CountAsync(r => r.ReviewerId == userId, cancellationToken);
    }

    // Response DTO for skill counts
    private record SkillCountResponse(
        int OfferedCount,
        int WantedCount,
        int TotalEndorsements);
}
