using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

public class ProficiencyLevelDeletedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<ProficiencyLevelDeletedDomainEventHandler> logger) 
    : BaseDomainEventHandler<ProficiencyLevelDeletedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(ProficiencyLevelDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Check if there are any skills still using this proficiency level
        var skillsWithLevel = await _dbContext.Skills
            .CountAsync(s => s.ProficiencyLevelId == domainEvent.LevelId && !s.IsDeleted, cancellationToken);

        if (skillsWithLevel > 0)
        {
            Logger.LogWarning("Proficiency level {Level} deleted but still has {SkillCount} active skills",
                domainEvent.Level, skillsWithLevel);
        }

        Logger.LogInformation("Proficiency level deleted: {Level} by user {UserId} - Reason: {Reason}",
            domainEvent.Level, domainEvent.DeletedByUserId, domainEvent.Reason);
    }
}