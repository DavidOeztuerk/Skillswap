using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

public class SkillEndorsedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillEndorsedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillEndorsedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillEndorsedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update skill search relevance based on endorsements
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Boost relevance for endorsed skills
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.1, 2.0);

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillEndorsedDomainEvent for skill {SkillId} - Total endorsements: {TotalEndorsements}",
            domainEvent.SkillId, domainEvent.TotalEndorsements);
    }
}
