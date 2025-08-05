using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for CancelNotification operation
/// </summary>
public record CancelNotificationResponse(
    string NotificationId,
    DateTime CancelledAt,
    string Message)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
