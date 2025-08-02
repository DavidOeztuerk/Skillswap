using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Events.Integration.UserManagement;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Notifications for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    NotificationDbContext dbContext,
    ILogger<UserDeletedIntegrationEventHandler> logger) 
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly NotificationDbContext _dbContext = dbContext;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        var deletedNotificationsCount = 0;
        var deletedPreferencesCount = 0;

        // Delete all Notifications for this user
        var notificationsToDelete = await _dbContext.Notifications
            .Where(n => n.UserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (notificationsToDelete.Any())
        {
            _dbContext.Notifications.RemoveRange(notificationsToDelete);
            deletedNotificationsCount = notificationsToDelete.Count;
            Logger.LogInformation("Marked {Count} Notifications for deletion for user {UserId}", 
                deletedNotificationsCount, integrationEvent.UserId);
        }

        // Delete NotificationPreferences for this user
        var preferencesToDelete = await _dbContext.NotificationPreferences
            .Where(p => p.UserId == integrationEvent.UserId)
            .ToListAsync(cancellationToken);

        if (preferencesToDelete.Any())
        {
            _dbContext.NotificationPreferences.RemoveRange(preferencesToDelete);
            deletedPreferencesCount = preferencesToDelete.Count;
            Logger.LogInformation("Marked {Count} NotificationPreferences for deletion for user {UserId}", 
                deletedPreferencesCount, integrationEvent.UserId);
        }

        // Save all changes
        if (deletedNotificationsCount > 0 || deletedPreferencesCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            Logger.LogInformation("Successfully deleted {NotificationsCount} Notifications and {PreferencesCount} Preferences for user {UserId}", 
                deletedNotificationsCount, deletedPreferencesCount, integrationEvent.UserId);
        }
        else
        {
            Logger.LogInformation("No Notifications or Preferences found for user {UserId}", integrationEvent.UserId);
        }
    }
}