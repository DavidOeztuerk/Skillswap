using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using Events.Integration.UserManagement;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.EventHandlers;

/// <summary>
/// Handles UserDeletedEvent to cascade delete all Notifications for the deleted user
/// </summary>
public class UserDeletedIntegrationEventHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<UserDeletedIntegrationEventHandler> logger)
    : BaseDomainEventHandler<UserDeletedEvent>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    protected override async Task HandleDomainEvent(UserDeletedEvent integrationEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Processing UserDeletedEvent for user {UserId}", integrationEvent.UserId);

        // Delete all Notifications for this user (get all with large page size)
        var notificationsToDelete = await _unitOfWork.Notifications
            .GetByUserIdAsync(integrationEvent.UserId, 1, 10000, cancellationToken);

        if (notificationsToDelete.Any())
        {
            foreach (var notification in notificationsToDelete)
            {
                await _unitOfWork.Notifications.DeleteAsync(notification, cancellationToken);
            }

            Logger.LogInformation("Deleted {Count} Notifications for user {UserId}",
                notificationsToDelete.Count, integrationEvent.UserId);
        }

        // Delete NotificationPreferences for this user
        await _unitOfWork.NotificationPreferences.DeleteByUserIdAsync(integrationEvent.UserId, cancellationToken);

        // Save all changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Successfully deleted notifications and preferences for user {UserId}", integrationEvent.UserId);
    }
}
