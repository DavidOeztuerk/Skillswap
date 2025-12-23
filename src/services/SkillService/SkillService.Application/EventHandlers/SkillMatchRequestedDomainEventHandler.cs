using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL MATCHING EVENT HANDLERS
// ============================================================================

public class SkillMatchRequestedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillMatchRequestedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillMatchRequestedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillMatchRequestedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update match count for both skills
        var offeredSkill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.OfferedSkillId, cancellationToken);

        var requestedSkill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.RequestedSkillId, cancellationToken);

        if (offeredSkill != null)
        {
            offeredSkill.MatchCount++;
            offeredSkill.LastMatchedAt = DateTime.UtcNow;
        }

        if (requestedSkill != null)
        {
            requestedSkill.MatchCount++;
            requestedSkill.LastMatchedAt = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillMatchRequestedDomainEvent - Match {MatchId} with compatibility {CompatibilityScore}",
            domainEvent.MatchId, domainEvent.CompatibilityScore);
    }
}
