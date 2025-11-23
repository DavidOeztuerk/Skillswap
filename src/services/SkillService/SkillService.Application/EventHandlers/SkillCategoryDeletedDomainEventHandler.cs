using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillCategoryDeletedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillCategoryDeletedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillCategoryDeletedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillCategoryDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Check if there are any skills still using this category
        var skillsInCategory = await _unitOfWork.Skills
            .CountByCategoryAsync(domainEvent.CategoryId, includeDeleted: false, cancellationToken);

        if (skillsInCategory > 0)
        {
            Logger.LogWarning("Category {CategoryName} deleted but still has {SkillCount} active skills",
                domainEvent.Name, skillsInCategory);
        }

        Logger.LogInformation("Skill category deleted: {CategoryName} by user {UserId} - Reason: {Reason}",
            domainEvent.Name, domainEvent.DeletedByUserId, domainEvent.Reason);
    }
}
