using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for marking a specific notification as read
/// </summary>
/// <param name="NotificationId">ID of the notification to mark as read</param>
public record MarkNotificationAsReadRequest(
    [Required(ErrorMessage = "Notification ID is required")]
    string NotificationId) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
