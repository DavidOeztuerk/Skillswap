using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class ProficiencyLevelDeletedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<ProficiencyLevelDeletedDomainEventHandler> logger) 
    : BaseDomainEventHandler<ProficiencyLevelDeletedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(ProficiencyLevelDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Check if there are any skills still using this proficiency level
        var skillsWithLevel = await _unitOfWork.Skills
            .CountByProficiencyLevelAsync(domainEvent.LevelId, includeDeleted: false, cancellationToken);

        if (skillsWithLevel > 0)
        {
            Logger.LogWarning("Proficiency level {Level} deleted but still has {SkillCount} active skills",
                domainEvent.Level, skillsWithLevel);
        }

        Logger.LogInformation("Proficiency level deleted: {Level} by user {UserId} - Reason: {Reason}",
            domainEvent.Level, domainEvent.DeletedByUserId, domainEvent.Reason);
    }
}