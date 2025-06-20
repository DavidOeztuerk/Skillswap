// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

public class SkillMatchCompletedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillMatchCompletedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillMatchCompletedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillMatchCompletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Boost relevance for skills that have completed matches
        var offeredSkill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.OfferedSkillId, cancellationToken);

        var requestedSkill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.RequestedSkillId, cancellationToken);

        if (offeredSkill != null)
        {
            offeredSkill.SearchRelevanceScore = Math.Min(offeredSkill.SearchRelevanceScore * 1.15, 2.0);
        }

        if (requestedSkill != null)
        {
            requestedSkill.SearchRelevanceScore = Math.Min(requestedSkill.SearchRelevanceScore * 1.15, 2.0);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillMatchCompletedDomainEvent - Match {MatchId} completed after {Duration} minutes",
            domainEvent.MatchId, domainEvent.SessionDurationMinutes);
    }
}
