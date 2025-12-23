using NotificationService.Domain.Models;

namespace NotificationService.Domain.Services;

/// <summary>
/// Interface for intelligent notification routing service
/// </summary>
public interface ISmartNotificationRouter
{
    /// <summary>
    /// Routes a notification to the optimal channels based on user preferences, priority, and timing
    /// </summary>
    /// <param name="request">The routing request containing notification details</param>
    /// <returns>A routing decision with selected channels and timing</returns>
    Task<NotificationRoutingDecision> RouteNotificationAsync(NotificationRoutingRequest request);

    /// <summary>
    /// Gets available notification channels for a user with their verification status and success rates
    /// </summary>
    /// <param name="userId">The user ID to check channels for</param>
    /// <returns>List of available channels with detailed information</returns>
    Task<List<UserChannelInfo>> GetAvailableChannelsAsync(string userId);
}
