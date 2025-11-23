using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for DeleteNotification operation
/// </summary>
public record DeleteNotificationResponse(
    string NotificationId,
    DateTime DeletedAt,
    string Message)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
