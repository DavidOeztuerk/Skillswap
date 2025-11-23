using CQRS.Handlers;
using Events.Domain.Skill;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.EventHandlers;

public class SkillDeletedDomainEventHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SkillDeletedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update category statistics
        var skill = await _unitOfWork.Skills
            .GetByIdAsync(domainEvent.SkillId, cancellationToken);

        if (skill != null)
        {
            // Update the category's UpdatedAt timestamp
            var category = await _unitOfWork.SkillCategories.GetByIdAsync(skill.SkillCategoryId, cancellationToken);
            if (category != null)
            {
                category.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillDeletedDomainEvent for skill {SkillId}", domainEvent.SkillId);
    }
}
