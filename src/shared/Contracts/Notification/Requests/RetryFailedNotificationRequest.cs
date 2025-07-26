using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for retrying a failed notification
/// </summary>
/// <param name="NotificationId">ID of the failed notification to retry</param>
/// <param name="MaxRetries">Maximum number of retry attempts</param>
public record RetryFailedNotificationRequest(
    [Required(ErrorMessage = "Notification ID is required")]
    string NotificationId,
    
    [Range(1, 10, ErrorMessage = "Max retries must be between 1 and 10")]
    int MaxRetries = 3) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
