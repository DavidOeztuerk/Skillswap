using NotificationService.Domain.Entities;

namespace NotificationService.Infrastructure.Services;

// ============================================================================
// NOTIFICATION ORCHESTRATOR SERVICE
// ============================================================================

public interface INotificationOrchestrator
{
    Task<bool> SendNotificationAsync(Notification notification);
    Task<bool> ShouldSendNotificationAsync(string userId, string type, string template);
    Task LogNotificationEventAsync(string notificationId, string eventType, string? details = null);
}
