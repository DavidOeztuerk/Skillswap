using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace NotificationService.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly NotificationDbContext _dbContext;
    private readonly ILogger<NotificationHub> _logger;
    private static readonly Dictionary<string, List<string>> _userConnections = new();

    public NotificationHub(NotificationDbContext dbContext, ILogger<NotificationHub> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

        lock (_userConnections)
        {
            if (!_userConnections.ContainsKey(userId))
                _userConnections[userId] = new List<string>();
            _userConnections[userId].Add(Context.ConnectionId);
        }

        _logger.LogInformation("User {UserId} connected to Notification hub with connection {ConnectionId}",
            userId, Context.ConnectionId);

        await SendUnreadCount(userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");

            lock (_userConnections)
            {
                if (_userConnections.ContainsKey(userId))
                {
                    _userConnections[userId].Remove(Context.ConnectionId);
                    if (_userConnections[userId].Count == 0)
                        _userConnections.Remove(userId);
                }
            }

            _logger.LogInformation("User {UserId} disconnected from Notification hub", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task MarkAsRead(string notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var notification = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && notification.ReadAt == null)
            {
                notification.ReadAt = DateTime.UtcNow;
                notification.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                await SendUnreadCount(userId);
                await Clients.Group($"user-{userId}").SendAsync("NotificationRead", notificationId);

                _logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}",
                    notificationId, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read", notificationId);
            await Clients.Caller.SendAsync("Error", "Failed to mark notification as read");
        }
    }

    public async Task MarkAllAsRead()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var unreadNotifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && n.ReadAt == null)
                .ToListAsync();

            if (unreadNotifications.Any())
            {
                var now = DateTime.UtcNow;
                foreach (var n in unreadNotifications)
                {
                    n.ReadAt = now;
                    n.UpdatedAt = now;
                }

                await _dbContext.SaveChangesAsync();

                await Clients.Group($"user-{userId}").SendAsync("UnreadCount", 0);
                await Clients.Group($"user-{userId}").SendAsync("AllNotificationsRead");

                _logger.LogInformation("All notifications marked as read for user {UserId}", userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
            await Clients.Caller.SendAsync("Error", "Failed to mark all notifications as read");
        }
    }

    public async Task GetRecentNotifications(int count = 10)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Take(count)
                .Select(n => new
                {
                    n.Id,
                    Title = n.Subject,
                    Message = n.Content,
                    n.Type,
                    n.Priority,
                    IsRead = n.ReadAt != null,
                    n.CreatedAt,
                    n.ReadAt,
                    Metadata = n.MetadataJson
                })
                .ToListAsync();

            await Clients.Caller.SendAsync("RecentNotifications", notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent notifications for user {UserId}", userId);
            await Clients.Caller.SendAsync("Error", "Failed to get recent notifications");
        }
    }

    public async Task SubscribeToType(string notificationType)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"type-{notificationType}");
        _logger.LogInformation("User {UserId} subscribed to notification type {Type}", userId, notificationType);
    }

    public async Task UnsubscribeFromType(string notificationType)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"type-{notificationType}");
        _logger.LogInformation("User {UserId} unsubscribed from notification type {Type}", userId, notificationType);
    }

    public static async Task SendNotificationToUser(
        IHubContext<NotificationHub> hubContext,
        string userId,
        object notification)
    {
        await hubContext.Clients.Group($"user-{userId}").SendAsync("NewNotification", notification);
    }

    public static async Task SendNotificationToType(
        IHubContext<NotificationHub> hubContext,
        string notificationType,
        object notification)
    {
        await hubContext.Clients.Group($"type-{notificationType}").SendAsync("NewNotification", notification);
    }

    public static bool IsUserConnected(string userId)
    {
        lock (_userConnections)
        {
            return _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
        }
    }

    private async Task SendUnreadCount(string userId)
    {
        try
        {
            var unreadCount = await _dbContext.Notifications
                .CountAsync(n => n.UserId == userId && n.ReadAt == null && !n.IsDeleted);

            await Clients.Group($"user-{userId}").SendAsync("UnreadCount", unreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending unread count to user {UserId}", userId);
        }
    }

    private string? GetUserId() => Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
