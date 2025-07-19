using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL INTERACTION EVENT HANDLERS
// ============================================================================

public class SkillViewedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillViewedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillViewedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillViewedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill view statistics
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.ViewCount++;
            skill.LastViewedAt = domainEvent.ViewedAt;

            // Boost search relevance for popular skills
            if (skill.ViewCount % 10 == 0) // Every 10 views
            {
                skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.05, 2.0);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillViewedDomainEvent for skill {SkillId} by user {ViewerId}",
            domainEvent.SkillId, domainEvent.ViewerUserId ?? "anonymous");
    }
}
