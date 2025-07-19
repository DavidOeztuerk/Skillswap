using System.ComponentModel.DataAnnotations;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for CancelNotification operation
/// </summary>
public record CancelNotificationRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
