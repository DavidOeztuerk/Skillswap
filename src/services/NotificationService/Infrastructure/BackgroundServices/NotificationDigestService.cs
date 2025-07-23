using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;

namespace NotificationService.Infrastructure.BackgroundServices;

public class NotificationDigestService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationDigestService> _logger;
    private readonly TimeSpan _digestInterval = TimeSpan.FromHours(1); // Check every hour

    public NotificationDigestService(
        IServiceProvider serviceProvider,
        ILogger<NotificationDigestService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationDigestService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDailyDigestsAsync(stoppingToken);
                await ProcessWeeklyDigestsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing digests");
            }

            await Task.Delay(_digestInterval, stoppingToken);
        }

        _logger.LogInformation("NotificationDigestService stopped");
    }

    private async Task ProcessDailyDigestsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Only process daily digests at 9 AM UTC
        if (now.Hour != 9 || now.Minute > 30) // 30-minute window
            return;

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            // Find users who want daily digests
            var dailyDigestUsers = await dbContext.NotificationPreferences
                .Where(p => p.DigestFrequency == "Daily" && p.EmailEnabled && !p.IsDeleted)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Processing daily digests for {Count} users", dailyDigestUsers.Count);

            foreach (var userPrefs in dailyDigestUsers)
            {
                try
                {
                    await GenerateAndSendDigestAsync(userPrefs.UserId, "daily", cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send daily digest to user {UserId}", userPrefs.UserId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing daily digests");
        }
    }

    private async Task ProcessWeeklyDigestsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Only process weekly digests on Monday at 9 AM UTC
        if (now.DayOfWeek != DayOfWeek.Monday || now.Hour != 9 || now.Minute > 30)
            return;

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        try
        {
            var weeklyDigestUsers = await dbContext.NotificationPreferences
                .Where(p => p.DigestFrequency == "Weekly" && p.EmailEnabled && !p.IsDeleted)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Processing weekly digests for {Count} users", weeklyDigestUsers.Count);

            foreach (var userPrefs in weeklyDigestUsers)
            {
                try
                {
                    await GenerateAndSendDigestAsync(userPrefs.UserId, "weekly", cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send weekly digest to user {UserId}", userPrefs.UserId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing weekly digests");
        }
    }

    private async Task GenerateAndSendDigestAsync(string userId, string frequency, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        var timeRange = frequency == "daily" ? DateTime.UtcNow.AddDays(-1) : DateTime.UtcNow.AddDays(-7);

        var userNotifications = await dbContext.Notifications
            .Where(n => n.UserId == userId &&
                       n.CreatedAt >= timeRange &&
                       !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20) // Limit to 20 most recent
            .ToListAsync(cancellationToken);

        if (userNotifications.Any())
        {
            // Generate digest content
            var digestContent = GenerateDigestContent(userNotifications, frequency);

            // This would typically use the notification service to send the digest
            _logger.LogInformation("Generated {Frequency} digest for user {UserId} with {Count} notifications",
                frequency, userId, userNotifications.Count);
        }
    }

    private static string GenerateDigestContent(List<Notification> notifications, string frequency)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"<h2>Your {frequency} notification digest</h2>");
        sb.AppendLine($"<p>You have {notifications.Count} notifications from the past {frequency}:</p>");
        sb.AppendLine("<ul>");

        foreach (var notification in notifications.Take(10))
        {
            sb.AppendLine($"<li><strong>{notification.Subject}</strong> - {notification.CreatedAt:MMM dd, HH:mm}</li>");
        }

        sb.AppendLine("</ul>");

        if (notifications.Count > 10)
        {
            sb.AppendLine($"<p>... and {notifications.Count - 10} more notifications.</p>");
        }

        return sb.ToString();
    }
}