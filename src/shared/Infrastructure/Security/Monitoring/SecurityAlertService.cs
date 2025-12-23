using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Security.Monitoring;

/// <summary>
/// Implementation of security alert service
/// Uses Redis for recent alerts cache and PostgreSQL for persistent storage
/// </summary>
public class SecurityAlertService : ISecurityAlertService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<SecurityAlertService> _logger;
    private readonly SecurityAlertConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private const string ALERT_CACHE_PREFIX = "security:alerts:";
    private const string ALERT_LIST_CACHE_KEY = "security:alerts:list";
    private const string ALERT_STATS_CACHE_KEY = "security:alerts:stats";
    private const string UNREAD_COUNT_CACHE_KEY = "security:alerts:unread:count";

    // In-memory storage for alerts (will be replaced with DbContext in next step)
    private static readonly List<SecurityAlert> _alerts = new();
    private static readonly object _lock = new();

    public SecurityAlertService(
        IDistributedCache cache,
        ILogger<SecurityAlertService> logger,
        IOptions<SecurityAlertConfiguration> configuration,
        IHttpContextAccessor httpContextAccessor)
    {
        _cache = cache;
        _logger = logger;
        _configuration = configuration.Value;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<SecurityAlert> SendAlertAsync(
        SecurityAlertLevel level,
        SecurityAlertType type,
        string title,
        string message,
        Dictionary<string, object>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        if (!_configuration.Enabled)
        {
            _logger.LogDebug("Security alerts are disabled, skipping alert: {Title}", title);
            return CreateAlert(level, type, title, message, metadata);
        }

        try
        {
            // Check for duplicate alerts (throttling)
            var existingAlert = await FindDuplicateAlertAsync(type, title, cancellationToken);
            if (existingAlert != null)
            {
                // Increment occurrence count instead of creating new alert
                return await IncrementAlertOccurrenceAsync(existingAlert, cancellationToken);
            }

            // Create new alert
            var alert = CreateAlert(level, type, title, message, metadata);

            // Store in memory (temporary - will use DbContext)
            lock (_lock)
            {
                _alerts.Add(alert);
            }

            // Cache the alert
            await CacheAlertAsync(alert, cancellationToken);

            // Invalidate cached lists and stats
            await InvalidateCachedDataAsync(cancellationToken);

            // Log the alert
            LogAlert(alert);

            // Send notifications for critical alerts
            if (level == SecurityAlertLevel.Critical && _configuration.EnableEmailNotifications)
            {
                await SendNotificationsAsync(alert, cancellationToken);
            }

            // Check auto-action thresholds
            await CheckAutoActionThresholdsAsync(alert, cancellationToken);

            return alert;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending security alert: {Title}", title);
            throw;
        }
    }

    public async Task<(List<SecurityAlert> Alerts, int TotalCount)> GetRecentAlertsAsync(
        int pageNumber = 1,
        int pageSize = 50,
        SecurityAlertLevel? minLevel = null,
        SecurityAlertType? type = null,
        bool includeRead = true,
        bool includeDismissed = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to get from cache first
            var cacheKey = $"{ALERT_LIST_CACHE_KEY}:{pageNumber}:{pageSize}:{minLevel}:{type}:{includeRead}:{includeDismissed}";
            var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);

            if (!string.IsNullOrEmpty(cached))
            {
                var cachedData = JsonSerializer.Deserialize<(List<SecurityAlert>, int)>(cached);
                if (cachedData.Item1 != null)
                {
                    return cachedData;
                }
            }

            // Query from storage
            IEnumerable<SecurityAlert> query;
            lock (_lock)
            {
                query = _alerts.AsEnumerable();
            }

            // Apply filters
            if (minLevel.HasValue)
            {
                query = query.Where(a => a.Level >= minLevel.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(a => a.Type == type.Value);
            }

            if (!includeRead)
            {
                query = query.Where(a => !a.IsRead);
            }

            if (!includeDismissed)
            {
                query = query.Where(a => !a.IsDismissed);
            }

            // Order by occurrence time (most recent first)
            query = query.OrderByDescending(a => a.LastOccurrenceAt ?? a.OccurredAt);

            var totalCount = query.Count();
            var alerts = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Cache the result
            var result = (alerts, totalCount);
            await _cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(result),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                },
                cancellationToken);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent alerts");
            return (new List<SecurityAlert>(), 0);
        }
    }

    public async Task<SecurityAlert?> GetAlertByIdAsync(
        string alertId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Try cache first
            var cacheKey = $"{ALERT_CACHE_PREFIX}{alertId}";
            var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);

            if (!string.IsNullOrEmpty(cached))
            {
                return JsonSerializer.Deserialize<SecurityAlert>(cached);
            }

            // Query from storage
            SecurityAlert? alert;
            lock (_lock)
            {
                alert = _alerts.FirstOrDefault(a => a.Id == alertId);
            }

            if (alert != null)
            {
                await CacheAlertAsync(alert, cancellationToken);
            }

            return alert;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting alert by ID: {AlertId}", alertId);
            return null;
        }
    }

    public async Task<SecurityAlertStatistics> GetAlertStatisticsAsync(
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            from ??= DateTime.UtcNow.AddDays(-30);
            to ??= DateTime.UtcNow;

            IEnumerable<SecurityAlert> query;
            lock (_lock)
            {
                query = _alerts
                    .Where(a => a.OccurredAt >= from && a.OccurredAt <= to)
                    .ToList();
            }

            var stats = new SecurityAlertStatistics
            {
                TotalAlerts = query.Count(),
                CriticalAlerts = query.Count(a => a.Level == SecurityAlertLevel.Critical),
                HighAlerts = query.Count(a => a.Level == SecurityAlertLevel.High),
                MediumAlerts = query.Count(a => a.Level == SecurityAlertLevel.Medium),
                LowAlerts = query.Count(a => a.Level == SecurityAlertLevel.Low),
                InfoAlerts = query.Count(a => a.Level == SecurityAlertLevel.Info),
                UnreadAlerts = query.Count(a => !a.IsRead),
                ActiveAlerts = query.Count(a => !a.IsDismissed),
                DismissedAlerts = query.Count(a => a.IsDismissed),
                LastCriticalAlertAt = query
                    .Where(a => a.Level == SecurityAlertLevel.Critical)
                    .Max(a => (DateTime?)a.OccurredAt),
                LastAlertAt = query.Max(a => (DateTime?)a.OccurredAt)
            };

            // Group by type
            stats.AlertsByType = query
                .GroupBy(a => a.Type)
                .Select(g => new AlertTypeCount
                {
                    Type = g.Key,
                    Count = g.Count(),
                    HighestSeverity = g.Max(a => a.Level)
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // Timeline (last 30 days)
            stats.Timeline = Enumerable.Range(0, 30)
                .Select(i => from.Value.AddDays(i).Date)
                .Select(date => new AlertTimelinePoint
                {
                    Date = date,
                    Critical = query.Count(a => a.OccurredAt.Date == date && a.Level == SecurityAlertLevel.Critical),
                    High = query.Count(a => a.OccurredAt.Date == date && a.Level == SecurityAlertLevel.High),
                    Medium = query.Count(a => a.OccurredAt.Date == date && a.Level == SecurityAlertLevel.Medium),
                    Low = query.Count(a => a.OccurredAt.Date == date && a.Level == SecurityAlertLevel.Low),
                    Info = query.Count(a => a.OccurredAt.Date == date && a.Level == SecurityAlertLevel.Info)
                })
                .ToList();

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting alert statistics");
            return new SecurityAlertStatistics();
        }
    }

    public async Task MarkAlertAsReadAsync(
        string alertId,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            SecurityAlert? alert;
            lock (_lock)
            {
                alert = _alerts.FirstOrDefault(a => a.Id == alertId);
            }

            if (alert == null)
            {
                _logger.LogWarning("Alert not found: {AlertId}", alertId);
                return;
            }

            alert.IsRead = true;
            alert.ReadAt = DateTime.UtcNow;
            alert.ReadByAdminId = adminUserId;

            await CacheAlertAsync(alert, cancellationToken);
            await InvalidateCachedDataAsync(cancellationToken);

            _logger.LogInformation("Alert {AlertId} marked as read by admin {AdminId}", alertId, adminUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking alert as read: {AlertId}", alertId);
            throw;
        }
    }

    public async Task DismissAlertAsync(
        string alertId,
        string adminUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        try
        {
            SecurityAlert? alert;
            lock (_lock)
            {
                alert = _alerts.FirstOrDefault(a => a.Id == alertId);
            }

            if (alert == null)
            {
                _logger.LogWarning("Alert not found: {AlertId}", alertId);
                return;
            }

            alert.IsDismissed = true;
            alert.DismissedAt = DateTime.UtcNow;
            alert.DismissedByAdminId = adminUserId;
            alert.DismissalReason = reason;

            await CacheAlertAsync(alert, cancellationToken);
            await InvalidateCachedDataAsync(cancellationToken);

            _logger.LogInformation("Alert {AlertId} dismissed by admin {AdminId}: {Reason}", alertId, adminUserId, reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dismissing alert: {AlertId}", alertId);
            throw;
        }
    }

    public async Task BulkDismissAlertsAsync(
        List<string> alertIds,
        string adminUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        try
        {
            foreach (var alertId in alertIds)
            {
                await DismissAlertAsync(alertId, adminUserId, reason, cancellationToken);
            }

            _logger.LogInformation("Bulk dismissed {Count} alerts by admin {AdminId}", alertIds.Count, adminUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk dismissing alerts");
            throw;
        }
    }

    public async Task<int> GetUnreadAlertCountAsync(
        SecurityAlertLevel? minLevel = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"{UNREAD_COUNT_CACHE_KEY}:{minLevel}";
            var cached = await _cache.GetStringAsync(cacheKey, cancellationToken);

            if (!string.IsNullOrEmpty(cached) && int.TryParse(cached, out var count))
            {
                return count;
            }

            IEnumerable<SecurityAlert> query;
            lock (_lock)
            {
                query = _alerts.Where(a => !a.IsRead && !a.IsDismissed);

                if (minLevel.HasValue)
                {
                    query = query.Where(a => a.Level >= minLevel.Value);
                }
            }

            var unreadCount = query.Count();

            await _cache.SetStringAsync(
                cacheKey,
                unreadCount.ToString(),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
                },
                cancellationToken);

            return unreadCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread alert count");
            return 0;
        }
    }

    public async Task CleanupOldAlertsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-_configuration.RetentionDays);

            lock (_lock)
            {
                var oldAlerts = _alerts.Where(a => a.OccurredAt < cutoffDate).ToList();

                foreach (var alert in oldAlerts)
                {
                    _alerts.Remove(alert);
                }

                if (oldAlerts.Any())
                {
                    _logger.LogInformation("Cleaned up {Count} old security alerts", oldAlerts.Count);
                }
            }

            await InvalidateCachedDataAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up old alerts");
        }
    }

    // Private helper methods

    private SecurityAlert CreateAlert(
        SecurityAlertLevel level,
        SecurityAlertType type,
        string title,
        string message,
        Dictionary<string, object>? metadata)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var alert = new SecurityAlert
        {
            Id = Guid.NewGuid().ToString(),
            Level = level,
            Type = type,
            Title = title,
            Message = message,
            Metadata = metadata ?? new Dictionary<string, object>(),
            UserId = httpContext?.User?.Claims.FirstOrDefault(c => c.Type == "sub")?.Value,
            IPAddress = httpContext?.Connection?.RemoteIpAddress?.ToString(),
            UserAgent = httpContext?.Request?.Headers["User-Agent"].ToString(),
            Endpoint = httpContext?.Request?.Path.ToString(),
            OccurredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        return alert;
    }

    private async Task<SecurityAlert?> FindDuplicateAlertAsync(
        SecurityAlertType type,
        string title,
        CancellationToken cancellationToken)
    {
        if (!_configuration.EnableAlertAggregation)
        {
            return null;
        }

        var throttleThreshold = DateTime.UtcNow.AddSeconds(-_configuration.DuplicateAlertThrottleSeconds);

        lock (_lock)
        {
            return _alerts.FirstOrDefault(a =>
                a.Type == type &&
                a.Title == title &&
                a.OccurredAt >= throttleThreshold &&
                !a.IsDismissed);
        }
    }

    private async Task<SecurityAlert> IncrementAlertOccurrenceAsync(
        SecurityAlert alert,
        CancellationToken cancellationToken)
    {
        alert.OccurrenceCount++;
        alert.LastOccurrenceAt = DateTime.UtcNow;

        await CacheAlertAsync(alert, cancellationToken);

        _logger.LogDebug("Incremented occurrence count for alert {AlertId} to {Count}", alert.Id, alert.OccurrenceCount);

        return alert;
    }

    private async Task CacheAlertAsync(SecurityAlert alert, CancellationToken cancellationToken)
    {
        var cacheKey = $"{ALERT_CACHE_PREFIX}{alert.Id}";
        await _cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(alert),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            },
            cancellationToken);
    }

    private async Task InvalidateCachedDataAsync(CancellationToken cancellationToken)
    {
        await _cache.RemoveAsync(ALERT_LIST_CACHE_KEY, cancellationToken);
        await _cache.RemoveAsync(ALERT_STATS_CACHE_KEY, cancellationToken);
        await _cache.RemoveAsync(UNREAD_COUNT_CACHE_KEY, cancellationToken);
    }

    private void LogAlert(SecurityAlert alert)
    {
        var logLevel = alert.Level switch
        {
            SecurityAlertLevel.Critical => LogLevel.Critical,
            SecurityAlertLevel.High => LogLevel.Error,
            SecurityAlertLevel.Medium => LogLevel.Warning,
            SecurityAlertLevel.Low => LogLevel.Information,
            SecurityAlertLevel.Info => LogLevel.Information,
            _ => LogLevel.Information
        };

        _logger.Log(logLevel, "SECURITY ALERT [{Level}] {Type}: {Title} - {Message}",
            alert.Level, alert.Type, alert.Title, alert.Message);
    }

    private async Task SendNotificationsAsync(SecurityAlert alert, CancellationToken cancellationToken)
    {
        // TODO: Implement email notifications
        _logger.LogWarning("Email notifications not yet implemented for alert: {AlertId}", alert.Id);
    }

    private async Task CheckAutoActionThresholdsAsync(SecurityAlert alert, CancellationToken cancellationToken)
    {
        // TODO: Implement auto-actions (IP blocking, user suspension)
        _logger.LogDebug("Auto-action check not yet implemented for alert: {AlertId}", alert.Id);
    }
}
