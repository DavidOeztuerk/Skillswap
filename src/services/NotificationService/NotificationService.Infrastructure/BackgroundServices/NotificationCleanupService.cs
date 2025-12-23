using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.BackgroundServices;

public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(6); // Run every 6 hours

    public NotificationCleanupService(
        IServiceProvider serviceProvider,
        ILogger<NotificationCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationCleanupService started");

        // Wait a bit before starting cleanup
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldNotificationsAsync(stoppingToken);
                await CleanupOldEventsAsync(stoppingToken);
                await UpdateDeliveryStatusAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during cleanup");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("NotificationCleanupService stopped");
    }

    private async Task CleanupOldNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-90); // Keep notifications for 90 days

            var oldNotifications = await dbContext.Notifications
                .Where(n => n.CreatedAt < cutoffDate &&
                           (n.Status == NotificationStatus.Sent ||
                            n.Status == NotificationStatus.Delivered ||
                            n.Status == NotificationStatus.Failed))
                .Take(1000) // Process in batches
                .ToListAsync(cancellationToken);

            if (oldNotifications.Any())
            {
                _logger.LogInformation("Cleaning up {Count} old notifications", oldNotifications.Count);

                // Soft delete
                foreach (var notification in oldNotifications)
                {
                    notification.IsDeleted = true;
                    notification.DeletedAt = DateTime.UtcNow;
                    notification.UpdatedAt = DateTime.UtcNow;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Cleaned up {Count} old notifications", oldNotifications.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up old notifications");
        }
    }

    private async Task CleanupOldEventsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-30); // Keep events for 30 days

            var oldEvents = await dbContext.NotificationEvents
                .Where(e => e.Timestamp < cutoffDate && !e.IsDeleted)
                .Take(5000) // Larger batch for events
                .ToListAsync(cancellationToken);

            if (oldEvents.Any())
            {
                _logger.LogInformation("Cleaning up {Count} old notification events", oldEvents.Count);

                // Soft delete
                foreach (var eventEntity in oldEvents)
                {
                    eventEntity.IsDeleted = true;
                    eventEntity.DeletedAt = DateTime.UtcNow;
                    eventEntity.UpdatedAt = DateTime.UtcNow;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Cleaned up {Count} old notification events", oldEvents.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up old notification events");
        }
    }

    private async Task UpdateDeliveryStatusAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            // Mark old sent notifications as delivered if no delivery confirmation received
            var cutoffDate = DateTime.UtcNow.AddHours(-24); // After 24 hours, assume delivered

            var sentNotifications = await dbContext.Notifications
                .Where(n => n.Status == NotificationStatus.Sent &&
                           n.SentAt.HasValue &&
                           n.SentAt.Value < cutoffDate &&
                           !n.IsDeleted)
                .Take(1000)
                .ToListAsync(cancellationToken);

            if (sentNotifications.Any())
            {
                _logger.LogInformation("Updating delivery status for {Count} sent notifications", sentNotifications.Count);

                foreach (var notification in sentNotifications)
                {
                    notification.Status = NotificationStatus.Delivered;
                    notification.DeliveredAt = notification.SentAt;
                    notification.UpdatedAt = DateTime.UtcNow;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery status");
        }
    }
}
