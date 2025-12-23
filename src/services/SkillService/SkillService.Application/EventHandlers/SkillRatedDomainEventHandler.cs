using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL RATING EVENT HANDLERS
// ============================================================================

public class SkillRatedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillRatedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillRatedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillRatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on rating
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

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

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillRatedDomainEvent for skill {SkillId} - New average: {AverageRating}",
            domainEvent.SkillId, domainEvent.NewAverageRating);
    }
}
