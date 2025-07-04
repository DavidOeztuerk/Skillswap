// ============================================================================
// SKILL SERVICE DOMAIN EVENT HANDLERS
// src/services/SkillService/Application/DomainEventHandlers/
// ============================================================================

using CQRS.Handlers;
using SkillService.Domain.Events;

namespace SkillService.Application.EventHandlers;

// ============================================================================
// PROFICIENCY LEVEL EVENT HANDLERS
// ============================================================================

public class ProficiencyLevelCreatedDomainEventHandler(
    ILogger<ProficiencyLevelCreatedDomainEventHandler> logger)
    : BaseDomainEventHandler<ProficiencyLevelCreatedDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(ProficiencyLevelCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Log proficiency level creation for analytics
        Logger.LogInformation("New proficiency level created: {Level} (Rank {Rank}) by user {UserId}",
            domainEvent.Level, domainEvent.Rank, domainEvent.CreatedByUserId);

        await Task.CompletedTask;
    }
}
