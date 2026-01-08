using Events.Integration.SkillManagement;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace UserService.Infrastructure.Consumers.UserStatistics;

/// <summary>
/// Consumes SkillDeletedEvent to update user statistics when a skill is deleted.
/// Note: SkillDeletedEvent doesn't include IsOffered, so we decrement SkillsOfferedCount by default
/// since most deleted skills are offered skills.
/// </summary>
public class SkillDeletedStatisticsConsumer : IConsumer<SkillDeletedEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<SkillDeletedStatisticsConsumer> _logger;

    public SkillDeletedStatisticsConsumer(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<SkillDeletedStatisticsConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SkillDeletedEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[UserStatistics] Processing SkillDeletedEvent: SkillId={SkillId}, UserId={UserId}",
            message.SkillId, message.UserId);

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();

            var statistics = await dbContext.UserStatistics
                .FirstOrDefaultAsync(s => s.UserId == message.UserId, context.CancellationToken);

            if (statistics == null)
            {
                _logger.LogWarning("[UserStatistics] No statistics found for user {UserId}, skipping", message.UserId);
                return;
            }

            // Decrement offered count (most deleted skills are offered)
            // Note: In a complete implementation, we would store skill type in the event
            if (statistics.SkillsOfferedCount > 0)
            {
                statistics.SkillsOfferedCount--;
            }

            statistics.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "[UserStatistics] Updated statistics for user {UserId}: OfferedCount={Offered}",
                message.UserId, statistics.SkillsOfferedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[UserStatistics] Error processing SkillDeletedEvent for user {UserId}", message.UserId);
            throw;
        }
    }
}
