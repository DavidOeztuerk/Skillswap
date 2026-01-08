using Events.Integration.Appointment;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;

namespace UserService.Infrastructure.Consumers.UserStatistics;

/// <summary>
/// Consumes SessionCompletedIntegrationEvent to update user statistics when a session is completed.
/// Updates SessionsCompletedCount and TotalSessionHours for both organizer and participant.
/// </summary>
public class SessionCompletedStatisticsConsumer : IConsumer<SessionCompletedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<SessionCompletedStatisticsConsumer> _logger;

    public SessionCompletedStatisticsConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<SessionCompletedStatisticsConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SessionCompletedIntegrationEvent> context)
    {
        var message = context.Message;

        // Skip no-show sessions for statistics
        if (message.IsNoShow)
        {
            _logger.LogInformation(
                "[UserStatistics] Skipping no-show session {SessionId}", message.SessionAppointmentId);
            return;
        }

        _logger.LogInformation(
            "[UserStatistics] Processing SessionCompletedEvent: SessionId={SessionId}, Organizer={OrganizerId}, Participant={ParticipantId}",
            message.SessionAppointmentId, message.OrganizerUserId, message.ParticipantUserId);

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

            // Calculate session duration
            var sessionDuration = message.CompletedAt - message.ScheduledDate;
            var sessionHours = (decimal)Math.Max(0, sessionDuration.TotalHours);

            // Update both users' statistics
            await UpdateUserSessionStatistics(dbContext, message.OrganizerUserId, sessionHours, context.CancellationToken);
            await UpdateUserSessionStatistics(dbContext, message.ParticipantUserId, sessionHours, context.CancellationToken);

            await dbContext.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "[UserStatistics] Updated session statistics for users {OrganizerId} and {ParticipantId}",
                message.OrganizerUserId, message.ParticipantUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UserStatistics] Error processing SessionCompletedEvent {SessionId}", message.SessionAppointmentId);
            throw;
        }
    }

    private async Task UpdateUserSessionStatistics(
        UserDbContext dbContext,
        string userId,
        decimal sessionHours,
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

        statistics.SessionsCompletedCount++;
        statistics.TotalSessionHours += sessionHours;
        statistics.LastActiveAt = DateTime.UtcNow;
        statistics.UpdatedAt = DateTime.UtcNow;
    }
}
