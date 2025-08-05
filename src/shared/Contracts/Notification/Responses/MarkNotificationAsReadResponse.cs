using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for MarkNotificationAsRead operation
/// </summary>
public record MarkNotificationAsReadResponse(
    string NotificationId,
    DateTime ReadAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
