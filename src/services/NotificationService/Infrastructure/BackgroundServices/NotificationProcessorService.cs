using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Services;

namespace NotificationService.Infrastructure.BackgroundServices;

// ============================================================================
// NOTIFICATION PROCESSOR SERVICE
// ============================================================================

public class NotificationProcessorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationProcessorService> _logger;
    private readonly TimeSpan _processingInterval = TimeSpan.FromSeconds(30);

    public NotificationProcessorService(
        IServiceProvider serviceProvider,
        ILogger<NotificationProcessorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationProcessorService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingNotificationsAsync(stoppingToken);
                await ProcessRetryNotificationsAsync(stoppingToken);
                await ProcessScheduledNotificationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing notifications");
            }

            await Task.Delay(_processingInterval, stoppingToken);
        }

        _logger.LogInformation("NotificationProcessorService stopped");
    }

    private async Task ProcessPendingNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
        var orchestrator = scope.ServiceProvider.GetRequiredService<INotificationOrchestrator>();

        try
        {
            var pendingNotifications = await dbContext.Notifications
                .Where(n => n.Status == NotificationStatus.Pending && !n.IsDeleted)
                .Take(50) // Process in batches
                .ToListAsync(cancellationToken);

            if (pendingNotifications.Any())
            {
                _logger.LogInformation("Processing {Count} pending notifications", pendingNotifications.Count);

                var tasks = pendingNotifications.Select(async notification =>
                {
                    try
                    {
                        await orchestrator.SendNotificationAsync(notification);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process notification {NotificationId}", notification.Id);
                    }
                });

                await Task.WhenAll(tasks);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pending notifications");
        }
    }

    private async Task ProcessRetryNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
        var orchestrator = scope.ServiceProvider.GetRequiredService<INotificationOrchestrator>();

        try
        {
            var retryNotifications = await dbContext.Notifications
                .Where(n => n.Status == NotificationStatus.Failed
                           && n.NextRetryAt.HasValue
                           && n.NextRetryAt.Value <= DateTime.UtcNow
                           && n.RetryCount < 5
                           && !n.IsDeleted)
                .Take(25) // Smaller batch for retries
                .ToListAsync(cancellationToken);

            if (retryNotifications.Any())
            {
                _logger.LogInformation("Processing {Count} retry notifications", retryNotifications.Count);

                foreach (var notification in retryNotifications)
                {
                    try
                    {
                        await orchestrator.LogNotificationEventAsync(notification.Id, NotificationEventTypes.Retry,
                            $"Retry attempt {notification.RetryCount + 1}");

                        await orchestrator.SendNotificationAsync(notification);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to retry notification {NotificationId}", notification.Id);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing retry notifications");
        }
    }

    private async Task ProcessScheduledNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            // Find scheduled notifications that are ready to be sent
            var scheduledNotifications = await dbContext.Notifications
                .Where(n => n.Status == NotificationStatus.Pending
                           && n.CreatedAt <= DateTime.UtcNow // Scheduled time has arrived
                           && !n.IsDeleted)
                .Take(25)
                .ToListAsync(cancellationToken);

            if (scheduledNotifications.Any())
            {
                _logger.LogInformation("Found {Count} scheduled notifications ready for processing", scheduledNotifications.Count);

                // Update status to trigger processing in next cycle
                foreach (var notification in scheduledNotifications)
                {
                    notification.Status = NotificationStatus.Pending;
                    notification.UpdatedAt = DateTime.UtcNow;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing scheduled notifications");
        }
    }
}
