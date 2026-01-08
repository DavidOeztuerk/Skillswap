using Events.Integration.SkillManagement;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;

namespace UserService.Infrastructure.Consumers.UserStatistics;

/// <summary>
/// Consumes SkillCreatedEvent to update user statistics when a skill is created.
/// Increments SkillsOfferedCount or SkillsWantedCount based on IsOffered.
/// </summary>
public class SkillCreatedStatisticsConsumer : IConsumer<SkillCreatedEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<SkillCreatedStatisticsConsumer> _logger;

    public SkillCreatedStatisticsConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<SkillCreatedStatisticsConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[UserStatistics] Processing SkillCreatedEvent: SkillId={SkillId}, UserId={UserId}, IsOffered={IsOffered}",
            message.SkillId, message.UserId, message.IsOffered);

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

            var statistics = await dbContext.UserStatistics
                .FirstOrDefaultAsync(s => s.UserId == message.UserId, context.CancellationToken);

            if (statistics == null)
            {
                // Create new statistics entry
                var user = await dbContext.Users
                    .FirstOrDefaultAsync(u => u.Id == message.UserId, context.CancellationToken);

                if (user == null)
                {
                    _logger.LogWarning("[UserStatistics] User {UserId} not found, skipping", message.UserId);
                    return;
                }

                statistics = Domain.Models.UserStatistics.CreateForUser(message.UserId, user.CreatedAt);
                dbContext.UserStatistics.Add(statistics);
            }

            // Update skill counts
            if (message.IsOffered)
            {
                statistics.SkillsOfferedCount++;
            }
            else
            {
                statistics.SkillsWantedCount++;
            }

            statistics.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "[UserStatistics] Updated statistics for user {UserId}: OfferedCount={Offered}, WantedCount={Wanted}",
                message.UserId, statistics.SkillsOfferedCount, statistics.SkillsWantedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UserStatistics] Error processing SkillCreatedEvent for user {UserId}", message.UserId);
            throw;
        }
    }
}
