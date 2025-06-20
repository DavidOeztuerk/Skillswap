// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

public class SkillDeletedDomainEventHandler(
    SkillDbContext dbContext,
    ILogger<SkillDeletedDomainEventHandler> logger) 
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Update category statistics
        var skill = await _dbContext.Skills
            .Include(s => s.SkillCategory)
            .FirstOrDefaultAsync(s => s.Id == domainEvent.SkillId, cancellationToken);

        if (skill?.SkillCategory != null)
        {
            skill.SkillCategory.SkillCount--;
            skill.SkillCategory.ActiveSkillCount--;
            skill.SkillCategory.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Processed SkillDeletedDomainEvent for skill {SkillId}", domainEvent.SkillId);
    }
}
