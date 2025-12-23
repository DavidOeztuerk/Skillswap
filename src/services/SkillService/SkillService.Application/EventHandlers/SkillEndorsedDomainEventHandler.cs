using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillEndorsedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillEndorsedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillEndorsedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillEndorsedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on endorsements
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Boost relevance for endorsed skills
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.1, 2.0);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillEndorsedDomainEvent for skill {SkillId} - Total endorsements: {TotalEndorsements}",
            domainEvent.SkillId, domainEvent.TotalEndorsements);
    }
}
