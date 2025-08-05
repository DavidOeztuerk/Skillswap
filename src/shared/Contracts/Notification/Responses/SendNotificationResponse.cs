using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for SendNotification operation
/// </summary>
public record SendNotificationResponse(
    string NotificationId,
    DateTime SentAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
