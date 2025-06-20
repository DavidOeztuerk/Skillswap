// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using MediatR;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Domain.Events;
using SkillService.Domain.Entities;
using Events;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL LIFECYCLE EVENT HANDLERS
// ============================================================================

public class SkillCreatedDomainEventHandler(
    SkillDbContext dbContext,
    IPublisher publisher,
    ILogger<SkillCreatedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillCreatedDomainEvent>(logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IPublisher _publisher = publisher;

    protected override async Task HandleDomainEvent(SkillCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Create activity log entry
        var activityLog = new SkillView
        {
            SkillId = domainEvent.SkillId,
            ViewerUserId = domainEvent.UserId,
            ViewSource = ViewSources.Direct,
            ViewedAt = DateTime.UtcNow,
            ViewDurationSeconds = 0
        };

        _dbContext.Set<SkillView>().Add(activityLog);

        // Update category statistics
        var category = await _dbContext.SkillCategories
            .FirstOrDefaultAsync(c => c.Id == domainEvent.SkillCategoryId, cancellationToken);

        if (category != null)
        {
            category.SkillCount++;
            category.ActiveSkillCount++;
            category.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish integration event for other services
        await _publisher.Publish(new SkillCreatedEvent(
            domainEvent.SkillId,
            domainEvent.Name,
            domainEvent.Description,
            domainEvent.IsOffering,
            domainEvent.UserId), cancellationToken);

        Logger.LogInformation("Processed SkillCreatedDomainEvent for skill {SkillId}", domainEvent.SkillId);
    }
}
