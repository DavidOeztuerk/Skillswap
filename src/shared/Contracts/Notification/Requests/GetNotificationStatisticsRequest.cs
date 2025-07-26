using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for getting notification statistics
/// </summary>
/// <param name="StartDate">Statistics from this date</param>
/// <param name="EndDate">Statistics to this date</param>
/// <param name="Type">Filter by notification type</param>
/// <param name="Template">Filter by template name</param>
public record GetNotificationStatisticsRequest(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    
    [StringLength(50, ErrorMessage = "Type must not exceed 50 characters")]
    string? Type = null,
    
    [StringLength(100, ErrorMessage = "Template must not exceed 100 characters")]
    string? Template = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
