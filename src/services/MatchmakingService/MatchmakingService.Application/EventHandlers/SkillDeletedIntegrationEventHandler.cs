using CQRS.Handlers;
using Events.Domain.Skill;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.EventHandlers;

/// <summary>
/// Handles SkillDeletedDomainEvent to cascade delete all MatchRequests and Matches for the deleted skill
/// </summary>
public class SkillDeletedIntegrationEventHandler(
    IMatchmakingUnitOfWork unitOfWork,
    ILogger<SkillDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<SkillDeletedDomainEvent>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(SkillDeletedDomainEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing SkillDeletedEvent for skill {SkillId}", integrationEvent.SkillId);

        // Delete all MatchRequests for this skill using the dedicated repository method
        await _unitOfWork.MatchRequests.DeleteBySkillIdAsync(integrationEvent.SkillId, cancellationToken);
        Logger.LogInformation("Deleted MatchRequests for skill {SkillId}", integrationEvent.SkillId);

        // Delete all Matches for this skill using the dedicated repository method
        await _unitOfWork.Matches.DeleteBySkillIdAsync(integrationEvent.SkillId, cancellationToken);
        Logger.LogInformation("Deleted Matches for skill {SkillId}", integrationEvent.SkillId);

        // Save all changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        Logger.LogInformation("Successfully deleted all data for skill {SkillId}", integrationEvent.SkillId);
    }
}