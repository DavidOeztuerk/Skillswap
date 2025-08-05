using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for RetryFailedNotification operation
/// </summary>
public record RetryFailedNotificationResponse(
    string NotificationId,
    bool RetryScheduled,
    string NewStatus,
    string Message)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
