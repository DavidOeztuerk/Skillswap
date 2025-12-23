using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillUpdatedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillUpdatedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillUpdatedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillUpdatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update search relevance score based on changes
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Boost relevance score for recently updated skills
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.1, 2.0);
            skill.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillUpdatedDomainEvent for skill {SkillId} with changes: {Changes}",
            domainEvent.SkillId, string.Join(", ", domainEvent.ChangedFields.Keys));
    }
}
