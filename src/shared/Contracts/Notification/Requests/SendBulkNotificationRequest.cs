using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for sending bulk notifications
/// </summary>
/// <param name="UserIds">List of user IDs to send to</param>
/// <param name="Type">Type of notification</param>
/// <param name="Template">Template name to use</param>
/// <param name="GlobalVariables">Global variables for all notifications</param>
/// <param name="UserSpecificVariables">User-specific variables</param>
/// <param name="Priority">Priority level</param>
/// <param name="ScheduledAt">Optional: schedule for later delivery</param>
public record SendBulkNotificationRequest(
    [Required(ErrorMessage = "User IDs are required")]
    [MinLength(1, ErrorMessage = "At least one user ID is required")]
    List<string> UserIds,

    [Required(ErrorMessage = "Type is required")]
    [RegularExpression(@"^(Email|SMS|Push|InApp)$", ErrorMessage = "Type must be Email, SMS, Push, or InApp")]
    string Type,

    [Required(ErrorMessage = "Template is required")]
    [StringLength(100, ErrorMessage = "Template must not exceed 100 characters")]
    string Template,

    [Required(ErrorMessage = "Global variables are required")]
    Dictionary<string, string> GlobalVariables,

    Dictionary<string, Dictionary<string, string>>? UserSpecificVariables = null,

    [RegularExpression(@"^(Low|Normal|High|Urgent)$", ErrorMessage = "Priority must be Low, Normal, High, or Urgent")]
    string Priority = "Normal",

    DateTime? ScheduledAt = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
