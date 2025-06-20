// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

public class SkillSearchedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillSearchedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillSearchedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillSearchedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update search relevance for skills that appear in search results
        var skills = await _dbContext.Skills
            .Where(s => domainEvent.ResultSkillIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        foreach (var skill in skills)
        {
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.02, 2.0);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillSearchedDomainEvent with query '{Query}' returning {ResultCount} results",
            domainEvent.SearchQuery, domainEvent.ResultCount);
    }
}
