using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Domain.Skill;

namespace SkillService.Application.EventHandlers;

public class SkillTrendingDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillTrendingDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillTrendingDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillTrendingDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Mark skill as trending and boost relevance
        var skill = await _dbContext.Skills
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.3, 2.0);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillTrendingDomainEvent for skill {SkillId} - Growth rate: {GrowthRate}% over {TrendPeriod}",
            domainEvent.SkillId, domainEvent.GrowthRate, domainEvent.TrendPeriod);
    }
}
