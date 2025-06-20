// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

public class SkillUpdatedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillUpdatedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillUpdatedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillUpdatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update search relevance score based on changes
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Boost relevance score for recently updated skills
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.1, 2.0);
            skill.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillUpdatedDomainEvent for skill {SkillId} with changes: {Changes}",
            domainEvent.SkillId, string.Join(", ", domainEvent.ChangedFields.Keys));
    }
}
