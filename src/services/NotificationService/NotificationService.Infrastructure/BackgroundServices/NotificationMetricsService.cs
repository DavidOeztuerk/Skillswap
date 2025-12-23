using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.BackgroundServices;

public class NotificationMetricsService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationMetricsService> _logger;
    private readonly TimeSpan _metricsInterval = TimeSpan.FromMinutes(15);

    public NotificationMetricsService(
        IServiceProvider serviceProvider,
        ILogger<NotificationMetricsService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationMetricsService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectMetricsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while collecting metrics");
            }

            await Task.Delay(_metricsInterval, stoppingToken);
        }

        _logger.LogInformation("NotificationMetricsService stopped");
    }

    private async Task CollectMetricsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            var now = DateTime.UtcNow;
            var last24Hours = now.AddDays(-1);
            var lastHour = now.AddHours(-1);

            // Collect various metrics
            var metrics = new
            {
                Timestamp = now,
                Last24Hours = new
                {
                    Total = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && !n.IsDeleted, cancellationToken),
                    Sent = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Status == NotificationStatus.Sent && !n.IsDeleted, cancellationToken),
                    Failed = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Status == NotificationStatus.Failed && !n.IsDeleted, cancellationToken),
                    Pending = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Status == NotificationStatus.Pending && !n.IsDeleted, cancellationToken)
                },
                LastHour = new
                {
                    Total = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= lastHour && !n.IsDeleted, cancellationToken),
                    Sent = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= lastHour && n.Status == NotificationStatus.Sent && !n.IsDeleted, cancellationToken),
                    Failed = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= lastHour && n.Status == NotificationStatus.Failed && !n.IsDeleted, cancellationToken)
                },
                ByType = new
                {
                    Email = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Type == NotificationTypes.Email && !n.IsDeleted, cancellationToken),
                    SMS = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Type == NotificationTypes.SMS && !n.IsDeleted, cancellationToken),
                    Push = await dbContext.Notifications.CountAsync(n => n.CreatedAt >= last24Hours && n.Type == NotificationTypes.Push && !n.IsDeleted, cancellationToken)
                },
                QueueHealth = new
                {
                    PendingCount = await dbContext.Notifications.CountAsync(n => n.Status == NotificationStatus.Pending && !n.IsDeleted, cancellationToken),
                    RetryCount = await dbContext.Notifications.CountAsync(n => n.Status == NotificationStatus.Failed && n.NextRetryAt.HasValue && n.RetryCount < 5 && !n.IsDeleted, cancellationToken),
                    FailedPermanently = await dbContext.Notifications.CountAsync(n => n.Status == NotificationStatus.Failed && n.RetryCount >= 5 && !n.IsDeleted, cancellationToken)
                }
            };

            // Log metrics for monitoring systems to pick up
            _logger.LogInformation("NotificationMetrics: {@Metrics}", metrics);

            // Check for alerts
            if (metrics.QueueHealth.PendingCount > 1000)
            {
                _logger.LogWarning("High pending notification count: {PendingCount}", metrics.QueueHealth.PendingCount);
            }

            if (metrics.QueueHealth.FailedPermanently > 100)
            {
                _logger.LogWarning("High permanently failed notification count: {FailedCount}", metrics.QueueHealth.FailedPermanently);
            }

            var last24HourFailureRate = metrics.Last24Hours.Total > 0
                ? (double)metrics.Last24Hours.Failed / metrics.Last24Hours.Total
                : 0;

            if (last24HourFailureRate > 0.1) // 10% failure rate
            {
                _logger.LogWarning("High failure rate in last 24 hours: {FailureRate:P2}", last24HourFailureRate);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error collecting notification metrics");
        }
    }
}
