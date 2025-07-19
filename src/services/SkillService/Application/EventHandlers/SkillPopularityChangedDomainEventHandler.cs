using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL ANALYTICS EVENT HANDLERS
// ============================================================================

public class SkillPopularityChangedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillPopularityChangedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillPopularityChangedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillPopularityChangedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on popularity changes
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.SearchRelevanceScore = Math.Min(domainEvent.PopularityScore * 0.5 + 1.0, 2.0);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillPopularityChangedDomainEvent for skill {SkillId} - New popularity score: {PopularityScore}",
            domainEvent.SkillId, domainEvent.PopularityScore);
    }
}
