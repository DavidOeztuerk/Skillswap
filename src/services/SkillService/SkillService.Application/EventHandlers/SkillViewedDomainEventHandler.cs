using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL INTERACTION EVENT HANDLERS
// ============================================================================

public class SkillViewedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillViewedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillViewedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillViewedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill view statistics
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.ViewCount++;
            skill.LastViewedAt = domainEvent.ViewedAt;

            // Boost search relevance for popular skills
            if (skill.ViewCount % 10 == 0) // Every 10 views
            {
                skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.05, 2.0);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillViewedDomainEvent for skill {SkillId} by user {ViewerId}",
            domainEvent.SkillId, domainEvent.ViewerUserId ?? "anonymous");
    }
}
