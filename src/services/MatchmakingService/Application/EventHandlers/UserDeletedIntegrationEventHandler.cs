using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all MatchRequests and Matches for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    MatchmakingDbContext dbContext,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedMatchRequestsCount = 0;
        var deletedMatchesCount = 0;

        // Delete all MatchRequests where user is requester or target
        var matchRequestsToDelete = await _dbContext.MatchRequests
            .Where(mr => mr.RequesterId == integrationEvent.UserId || mr.TargetUserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (matchRequestsToDelete.Any())
        {
            _dbContext.MatchRequests.RemoveRange(matchRequestsToDelete);
            deletedMatchRequestsCount = matchRequestsToDelete.Count;
            Logger.LogInformation("Marked {Count} MatchRequests for deletion for user {UserId}", 
                deletedMatchRequestsCount, integrationEvent.UserId);
        }

        // Delete all Matches where user is offering or requesting
        var matchesToDelete = await _dbContext.Matches
            .Where(m => m.OfferingUserId == integrationEvent.UserId || m.RequestingUserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (matchesToDelete.Any())
        {
            _dbContext.Matches.RemoveRange(matchesToDelete);
            deletedMatchesCount = matchesToDelete.Count;
            Logger.LogInformation("Marked {Count} Matches for deletion for user {UserId}", 
                deletedMatchesCount, integrationEvent.UserId);
        }

        // Save all changes
        if (deletedMatchRequestsCount > 0 || deletedMatchesCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {MatchRequestsCount} MatchRequests and {MatchesCount} Matches for user {UserId}", 
                deletedMatchRequestsCount, deletedMatchesCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No MatchRequests or Matches found for user {UserId}", integrationEvent.UserId);
        }
    }
}