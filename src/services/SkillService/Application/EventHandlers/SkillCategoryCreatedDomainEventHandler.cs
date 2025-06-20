// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// SKILL CATEGORY EVENT HANDLERS
// ============================================================================

public class SkillCategoryCreatedDomainEventHandler(
    ILogger<SkillCategoryCreatedDomainEventHandler> logger)
    : BaseDomainEventHandler<SkillCategoryCreatedDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(SkillCategoryCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Log category creation for analytics
        Logger.LogInformation("New skill category created: {CategoryName} by user {UserId}",
            domainEvent.Name, domainEvent.CreatedByUserId);

        await Task.CompletedTask;
    }
}
