using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for sending a single notification
/// </summary>
/// <param name="Type">Type of notification (Email, SMS, Push)</param>
/// <param name="Template">Template name to use</param>
/// <param name="Recipient">Recipient identifier</param>
/// <param name="Variables">Template variables</param>
/// <param name="Priority">Priority level (Low, Normal, High, Urgent)</param>
/// <param name="ScheduledAt">Optional: schedule for later delivery</param>
/// <param name="CorrelationId">Optional: correlation ID for tracking</param>
public record SendNotificationRequest(
    [Required(ErrorMessage = "Type is required")]
    [RegularExpression(@"^(Email|SMS|Push|InApp)$", ErrorMessage = "Type must be Email, SMS, Push, or InApp")]
    string Type,

    [Required(ErrorMessage = "Template is required")]
    [StringLength(100, ErrorMessage = "Template must not exceed 100 characters")]
    string Template,

    [Required(ErrorMessage = "Recipient is required")]
    [StringLength(256, ErrorMessage = "Recipient must not exceed 256 characters")]
    string Recipient,

    [Required(ErrorMessage = "Variables are required")]
    Dictionary<string, string> Variables,

    [RegularExpression(@"^(Low|Normal|High|Urgent)$", ErrorMessage = "Priority must be Low, Normal, High, or Urgent")]
    string Priority = "Normal",

    DateTime? ScheduledAt = null,

    string? CorrelationId = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
