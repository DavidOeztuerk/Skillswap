using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for canceling an appointment
/// </summary>
/// <param name="AppointmentId">ID of the appointment to cancel</param>
/// <param name="Reason">Optional reason for cancellation</param>
public record CancelAppointmentRequest(
    [Required(ErrorMessage = "Appointment ID is required")]
    string AppointmentId,

    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
