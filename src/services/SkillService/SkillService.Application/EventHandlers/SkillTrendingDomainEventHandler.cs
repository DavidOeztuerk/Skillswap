using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillTrendingDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillTrendingDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillTrendingDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillTrendingDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Mark skill as trending and boost relevance
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.3, 2.0);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        Logger.LogInformation("Processed SkillTrendingDomainEvent for skill {SkillId} - Growth rate: {GrowthRate}% over {TrendPeriod}",
            domainEvent.SkillId, domainEvent.GrowthRate, domainEvent.TrendPeriod);
    }
}
