using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL ANALYTICS EVENT HANDLERS
// ============================================================================

public class SkillPopularityChangedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillPopularityChangedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillPopularityChangedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillPopularityChangedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on popularity changes
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.SearchRelevanceScore = Math.Min(domainEvent.PopularityScore * 0.5 + 1.0, 2.0);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillPopularityChangedDomainEvent for skill {SkillId} - New popularity score: {PopularityScore}",
            domainEvent.SkillId, domainEvent.PopularityScore);
    }
}
