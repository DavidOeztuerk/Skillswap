// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL MATCHING EVENT HANDLERS
// ============================================================================

public class SkillMatchRequestedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillMatchRequestedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillMatchRequestedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillMatchRequestedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update match count for both skills
        var offeredSkill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.OfferedSkillId, cancellationToken);

        var requestedSkill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.RequestedSkillId, cancellationToken);

        if (offeredSkill != null)
        {
            offeredSkill.MatchCount++;
            offeredSkill.LastMatchedAt = DateTime.UtcNow;
        }

        if (requestedSkill != null)
        {
            requestedSkill.MatchCount++;
            requestedSkill.LastMatchedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillMatchRequestedDomainEvent - Match {MatchId} with compatibility {CompatibilityScore}",
            domainEvent.MatchId, domainEvent.CompatibilityScore);
    }
}
