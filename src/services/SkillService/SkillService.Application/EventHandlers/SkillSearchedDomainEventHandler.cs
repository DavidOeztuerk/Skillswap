using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillSearchedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillSearchedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillSearchedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillSearchedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update search relevance for skills that appear in search results
        var skills = await _unitOfWork.Skills
            .GetByIdsAsync(domainEvent.ResultSkillIds, cancellationToken);

        foreach (var skill in skills)
        {
            skill.SearchRelevanceScore = Math.Min(skill.SearchRelevanceScore * 1.02, 2.0);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillSearchedDomainEvent with query '{Query}' returning {ResultCount} results",
            domainEvent.SearchQuery, domainEvent.ResultCount);
    }
}
