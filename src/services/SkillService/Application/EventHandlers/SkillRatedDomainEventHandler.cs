// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL RATING EVENT HANDLERS
// ============================================================================

public class SkillRatedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillRatedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillRatedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillRatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on rating
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Boost relevance for highly rated skills
            if (domainEvent.NewAverageRating >= 4.5)
            {
                skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.2, 2.0);
            }
            else if (domainEvent.NewAverageRating >= 4.0)
            {
                skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.1, 2.0);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillRatedDomainEvent for skill {SkillId} - New average: {AverageRating}",
            domainEvent.SkillId, domainEvent.NewAverageRating);
    }
}
