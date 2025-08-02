using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using VideocallService.Domain.Entities;

namespace VideocallService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all VideoCallSessions for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    VideoCallDbContext dbContext,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly VideoCallDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedSessionsCount = 0;
        var deletedParticipantsCount = 0;

        // Delete all VideoCallSessions where user is host
        var sessionsToDelete = await _dbContext.VideoCallSessions
            .Where(s => s.HostUserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (sessionsToDelete.Any())
        {
            _dbContext.VideoCallSessions.RemoveRange(sessionsToDelete);
            deletedSessionsCount = sessionsToDelete.Count;
            Logger.LogInformation("Marked {Count} VideoCallSessions for deletion for user {UserId}", 
                deletedSessionsCount, integrationEvent.UserId);
        }

        // Delete all CallParticipants for this user
        var participantsToDelete = await _dbContext.CallParticipants
            .Where(p => p.UserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (participantsToDelete.Any())
        {
            _dbContext.CallParticipants.RemoveRange(participantsToDelete);
            deletedParticipantsCount = participantsToDelete.Count;
            Logger.LogInformation("Marked {Count} CallParticipants for deletion for user {UserId}", 
                deletedParticipantsCount, integrationEvent.UserId);
        }

        // Save all changes
        if (deletedSessionsCount > 0 || deletedParticipantsCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {SessionsCount} VideoCallSessions and {ParticipantsCount} CallParticipants for user {UserId}", 
                deletedSessionsCount, deletedParticipantsCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No VideoCallSessions or CallParticipants found for user {UserId}", integrationEvent.UserId);
        }
    }
}