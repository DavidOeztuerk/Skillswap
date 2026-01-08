using Events.Integration.Matchmaking;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;

namespace UserService.Infrastructure.Consumers.UserStatistics;

/// <summary>
/// Consumes MatchCompletedIntegrationEvent to update user statistics when a match is completed.
/// Updates MatchesCompletedCount for both users.
/// </summary>
public class MatchCompletedStatisticsConsumer : IConsumer<MatchCompletedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<MatchCompletedStatisticsConsumer> _logger;

    public MatchCompletedStatisticsConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<MatchCompletedStatisticsConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchCompletedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[UserStatistics] Processing MatchCompletedEvent: MatchId={MatchId}, Offering={OfferingUserId}, Requesting={RequestingUserId}",
            message.MatchId, message.OfferingUserId, message.RequestingUserId);

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

            // Update both users' statistics
            await UpdateUserMatchStatistics(dbContext, message.OfferingUserId, context.CancellationToken);
            await UpdateUserMatchStatistics(dbContext, message.RequestingUserId, context.CancellationToken);

            await dbContext.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "[UserStatistics] Updated match statistics for users {OfferingUserId} and {RequestingUserId}",
                message.OfferingUserId, message.RequestingUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UserStatistics] Error processing MatchCompletedEvent {MatchId}", message.MatchId);
            throw;
        }
    }

    private async Task UpdateUserMatchStatistics(
        UserDbContext dbContext,
        string userId,
        CancellationToken cancellationToken)
    {
        var statistics = await dbContext.UserStatistics
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (statistics == null)
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("[UserStatistics] User {UserId} not found, skipping", userId);
                return;
            }

            statistics = Domain.Models.UserStatistics.CreateForUser(userId, user.CreatedAt);
            dbContext.UserStatistics.Add(statistics);
        }

        statistics.MatchesCompletedCount++;
        statistics.LastActiveAt = DateTime.UtcNow;
        statistics.UpdatedAt = DateTime.UtcNow;
    }
}
