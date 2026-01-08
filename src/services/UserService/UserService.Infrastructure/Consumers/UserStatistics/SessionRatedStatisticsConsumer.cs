using Events.Integration.Appointment;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;

namespace UserService.Infrastructure.Consumers.UserStatistics;

/// <summary>
/// Consumes SessionRatedIntegrationEvent to update user statistics when a rating is given.
/// Updates AverageRating, ReviewsReceivedCount, and ReviewsGivenCount.
/// </summary>
public class SessionRatedStatisticsConsumer : IConsumer<SessionRatedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<SessionRatedStatisticsConsumer> _logger;

    public SessionRatedStatisticsConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<SessionRatedStatisticsConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SessionRatedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[UserStatistics] Processing SessionRatedEvent: SessionId={SessionId}, Rater={RaterId}, Ratee={RateeId}, Rating={Rating}",
            message.SessionAppointmentId, message.RaterId, message.RateeId, message.Rating);

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

            // Update rater's ReviewsGivenCount
            await UpdateRaterStatistics(dbContext, message.RaterId, context.CancellationToken);

            // Update ratee's AverageRating and ReviewsReceivedCount
            await UpdateRateeStatistics(dbContext, message.RateeId, message.Rating, context.CancellationToken);

            await dbContext.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "[UserStatistics] Updated rating statistics for rater {RaterId} and ratee {RateeId}",
                message.RaterId, message.RateeId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UserStatistics] Error processing SessionRatedEvent for session {SessionId}", message.SessionAppointmentId);
            throw;
        }
    }

    private async Task UpdateRaterStatistics(
        UserDbContext dbContext,
        string raterId,
        CancellationToken cancellationToken)
    {
        var statistics = await GetOrCreateStatistics(dbContext, raterId, cancellationToken);
        if (statistics == null) return;

        statistics.ReviewsGivenCount++;
        statistics.UpdatedAt = DateTime.UtcNow;
    }

    private async Task UpdateRateeStatistics(
        UserDbContext dbContext,
        string rateeId,
        int newRating,
        CancellationToken cancellationToken)
    {
        var statistics = await GetOrCreateStatistics(dbContext, rateeId, cancellationToken);
        if (statistics == null) return;

        // Recalculate average rating
        var currentTotal = (statistics.AverageRating ?? 0) * statistics.ReviewsReceivedCount;
        statistics.ReviewsReceivedCount++;
        statistics.AverageRating = (currentTotal + newRating) / statistics.ReviewsReceivedCount;
        statistics.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<Domain.Models.UserStatistics?> GetOrCreateStatistics(
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
                return null;
            }

            statistics = Domain.Models.UserStatistics.CreateForUser(userId, user.CreatedAt);
            dbContext.UserStatistics.Add(statistics);
        }

        return statistics;
    }
}
