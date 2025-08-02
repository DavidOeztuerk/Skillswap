using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;
using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Application.EventHandlers;

/// <summary>
/// Handles SkillDeletedDomainEvent to cascade delete all MatchRequests and Matches for the deleted skill
/// </summary>
public class SkillDeletedIntegrationEventHandler(
    MatchmakingDbContext dbContext,
    ILogger<SkillDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing SkillDeletedEvent for skill {SkillId}", integrationEvent.SkillId);

        var deletedMatchRequestsCount = 0;
        var deletedMatchesCount = 0;

        // Delete all MatchRequests for this skill
        var matchRequestsToDelete = await _dbContext.MatchRequests
            .Where(mr => mr.SkillId == integrationEvent.SkillId || mr.ExchangeSkillId == integrationEvent.SkillId)
            .ToListAsync(cancellationToken);

        if (matchRequestsToDelete.Any())
        {
            _dbContext.MatchRequests.RemoveRange(matchRequestsToDelete);
            deletedMatchRequestsCount = matchRequestsToDelete.Count;
            Logger.LogInformation("Marked {Count} MatchRequests for deletion for skill {SkillId}", 
                deletedMatchRequestsCount, integrationEvent.SkillId);
        }

        // Delete all Matches for this skill
        var matchesToDelete = await _dbContext.Matches
            .Where(m => m.OfferedSkillId == integrationEvent.SkillId || 
                       m.RequestedSkillId == integrationEvent.SkillId ||
                       m.ExchangeSkillId == integrationEvent.SkillId)
            .ToListAsync(cancellationToken);

        if (matchesToDelete.Any())
        {
            _dbContext.Matches.RemoveRange(matchesToDelete);
            deletedMatchesCount = matchesToDelete.Count;
            Logger.LogInformation("Marked {Count} Matches for deletion for skill {SkillId}", 
                deletedMatchesCount, integrationEvent.SkillId);
        }

        // Save all changes
        if (deletedMatchRequestsCount > 0 || deletedMatchesCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {MatchRequestsCount} MatchRequests and {MatchesCount} Matches for skill {SkillId}", 
                deletedMatchRequestsCount, deletedMatchesCount, integrationEvent.SkillId);
        }
        else
        {
            Logger.LogInformation("No MatchRequests or Matches found for skill {SkillId}", integrationEvent.SkillId);
        }
    }
}