using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for SendBulkNotification operation
/// </summary>
public record SendBulkNotificationResponse(
    string BulkJobId,
    int TotalNotifications,
    int SuccessfulNotifications,
    int FailedNotifications,
    DateTime SubmittedAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
