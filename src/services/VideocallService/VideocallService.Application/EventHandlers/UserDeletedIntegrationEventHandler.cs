using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;

namespace VideocallService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all VideoCallSessions for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    IVideocallUnitOfWork unitOfWork,
    ILogger<UserDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        // Delete all VideoCallSessions where user is host
        await _unitOfWork.VideoCallSessions.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);
        Logger.LogInformation("Marked VideoCallSessions for deletion for user {UserId}", integrationEvent.UserId);

        // Delete all CallParticipants for this user
        await _unitOfWork.CallParticipants.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);
        Logger.LogInformation("Marked CallParticipants for deletion for user {UserId}", integrationEvent.UserId);

        // Save all changes
        var deletedCount = await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (deletedCount > 0)
        {
            Logger.LogInformation("Successfully deleted {Count} records for user {UserId}",
                deletedCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No VideoCallSessions or CallParticipants found for user {UserId}", integrationEvent.UserId);
        }
    }
}