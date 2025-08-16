using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for rescheduling an appointment
/// </summary>
/// <param name="NewScheduledDate">New scheduled date and time for the appointment (ISO-8601 format with timezone)</param>
/// <param name="NewDurationMinutes">New duration in minutes (optional, keeps original if not provided)</param>
/// <param name="Reason">Optional reason for rescheduling</param>
/// <remarks>
/// AppointmentId is provided via route parameter
/// </remarks>
public record RescheduleAppointmentRequest(
    [Required(ErrorMessage = "New scheduled date is required")]
    DateTimeOffset NewScheduledDate,

    [Range(15, 480, ErrorMessage = "Duration must be between 15 and 480 minutes")]
    int? NewDurationMinutes = null,

    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
