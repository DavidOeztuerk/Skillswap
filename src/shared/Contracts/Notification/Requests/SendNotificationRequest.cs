using System.ComponentModel.DataAnnotations;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for sending a single notification
/// </summary>
/// <param name="RecipientId">ID of the notification recipient</param>
/// <param name="Type">Type of notification</param>
/// <param name="Title">Notification title</param>
/// <param name="Message">Notification message</param>
/// <param name="Channel">Delivery channel (email, push, sms)</param>
/// <param name="Priority">Notification priority</param>
/// <param name="ScheduledFor">Optional: schedule for later delivery</param>
/// <param name="ExpiresAt">Optional: expiration time</param>
/// <param name="Metadata">Additional metadata</param>
public record SendNotificationRequest(
    [Required(ErrorMessage = "Recipient ID is required")]
    string RecipientId,

    [Required(ErrorMessage = "Notification type is required")]
    [StringLength(50, ErrorMessage = "Type must not exceed 50 characters")]
    string Type,

    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title must not exceed 200 characters")]
    string Title,

    [Required(ErrorMessage = "Message is required")]
    [StringLength(2000, ErrorMessage = "Message must not exceed 2000 characters")]
    string Message,

    [Required(ErrorMessage = "Channel is required")]
    [RegularExpression(@"^(email|push|sms|in_app)$", ErrorMessage = "Channel must be email, push, sms, or in_app")]
    string Channel,

    [Range(1, 5, ErrorMessage = "Priority must be between 1 (lowest) and 5 (highest)")]
    int Priority = 3,

    DateTime? ScheduledFor = null,

    DateTime? ExpiresAt = null,

    Dictionary<string, string>? Metadata = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
