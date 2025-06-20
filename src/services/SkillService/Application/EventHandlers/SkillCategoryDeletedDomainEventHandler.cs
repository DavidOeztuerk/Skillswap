// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

public class SkillCategoryDeletedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillCategoryDeletedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillCategoryDeletedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillCategoryDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Check if there are any skills still using this category
        var skillsInCategory = await _dbContext.Skills
            .CountAsync(s => s.SkillCategoryId == domainEvent.CategoryId && !s.IsDeleted, cancellationToken);

        if (skillsInCategory > 0)
        {
            Logger.LogWarning("Category {CategoryName} deleted but still has {SkillCount} active skills",
                domainEvent.Name, skillsInCategory);
        }

        Logger.LogInformation("Skill category deleted: {CategoryName} by user {UserId} - Reason: {Reason}",
            domainEvent.Name, domainEvent.DeletedByUserId, domainEvent.Reason);
    }
}
