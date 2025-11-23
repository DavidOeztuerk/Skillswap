using CQRS.Handlers;
using Events.Integration.UserManagement;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all MatchRequests and Matches for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    IMatchmakingUnitOfWork unitOfWork,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        // Delete all MatchRequests where user is requester or target using the dedicated repository method
        await _unitOfWork.MatchRequests.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);
        Logger.LogInformation("Deleted MatchRequests for user {UserId}", integrationEvent.UserId);

        // Delete all Matches where user is offering or requesting using the dedicated repository method
        await _unitOfWork.Matches.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);
        Logger.LogInformation("Deleted Matches for user {UserId}", integrationEvent.UserId);

        // Save all changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        Logger.LogInformation("Successfully deleted all data for user {UserId}", integrationEvent.UserId);
    }
}