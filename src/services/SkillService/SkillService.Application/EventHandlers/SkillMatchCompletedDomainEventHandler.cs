using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillMatchCompletedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillMatchCompletedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillMatchCompletedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillMatchCompletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Boost relevance for skills that have completed matches
        var offeredSkill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.OfferedSkillId, cancellationToken);

        var requestedSkill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.RequestedSkillId, cancellationToken);

        if (offeredSkill != null)
        {
            offeredSkill.SearchRelevanceScore = Math.Min(offeredSkill.SearchRelevanceScore * 1.15, 2.0);
        }

        if (requestedSkill != null)
        {
            requestedSkill.SearchRelevanceScore = Math.Min(requestedSkill.SearchRelevanceScore * 1.15, 2.0);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillMatchCompletedDomainEvent - Match {MatchId} completed after {Duration} minutes",
            domainEvent.MatchId, domainEvent.SessionDurationMinutes);
    }
}
