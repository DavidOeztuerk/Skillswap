using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for marking all notifications as read
/// </summary>
/// <param name="Type">Optional: only mark specific notification type as read</param>
/// <param name="BeforeDate">Optional: only mark notifications before this date as read</param>
public record MarkAllNotificationsAsReadRequest(
    [StringLength(50, ErrorMessage = "Type must not exceed 50 characters")]
    string? Type = null,
    
    DateTime? BeforeDate = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}