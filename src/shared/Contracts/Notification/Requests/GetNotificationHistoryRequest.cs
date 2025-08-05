using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for GetNotificationHistory operation
/// </summary>
/// <param name="Type">Filter by notification type</param>
/// <param name="Status">Filter by notification status</param>
/// <param name="StartDate">Filter notifications from this date</param>
/// <param name="EndDate">Filter notifications to this date</param>
/// <param name="Page">Page number (1-based)</param>
/// <param name="PageSize">Number of items per page</param>
public record GetNotificationHistoryRequest(
    string? Type = null,
    string? Status = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int PageNumber = 1,
    int PageSize = 20) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
