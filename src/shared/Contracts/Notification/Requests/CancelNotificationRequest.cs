using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for canceling a scheduled notification
/// </summary>
/// <param name="NotificationId">ID of the notification to cancel</param>
/// <param name="Reason">Reason for cancellation</param>
public record CancelNotificationRequest(
    [Required(ErrorMessage = "Notification ID is required")]
    string NotificationId,
    
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string Reason) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
