using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for getting user appointments with filtering and pagination
/// </summary>
/// <param name="Status">Optional status filter (e.g., "Pending", "Confirmed", "Completed", "Cancelled")</param>
/// <param name="FromDate">Optional start date filter</param>
/// <param name="ToDate">Optional end date filter</param>
/// <param name="IncludePast">Whether to include past appointments</param>
/// <param name="PageNumber">Page number for pagination (1-based)</param>
/// <param name="PageSize">Number of appointments per page</param>
public record GetUserAppointmentsRequest(
    [StringLength(50, ErrorMessage = "Status must not exceed 50 characters")]
    string? Status = null,

    DateTime? FromDate = null,

    DateTime? ToDate = null,

    bool IncludePast = true,

    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
    int PageNumber = 1,

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    int PageSize = 20)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
