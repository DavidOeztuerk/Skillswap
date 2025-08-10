using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetNotificationHistory operation
/// </summary>
public record GetNotificationHistoryResponse(
    NotificationHistoryItemResponse Notifications)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Represents a single item in the notification history
/// </summary>
public record NotificationHistoryItemResponse(
    string NotificationId,
    string Type,
    string Status,
    string Recipient,
    string Subject, // Or a summary of the content
    DateTime SentAt,
    DateTime? OpenedAt,
    string? ErrorMessage);