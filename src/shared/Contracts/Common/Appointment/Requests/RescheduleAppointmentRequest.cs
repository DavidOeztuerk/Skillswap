using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for rescheduling an appointment
/// </summary>
/// <param name="AppointmentId">ID of the appointment to reschedule</param>
/// <param name="NewScheduledDate">New scheduled date and time for the appointment</param>
/// <param name="Reason">Optional reason for rescheduling</param>
public record RescheduleAppointmentRequest(
    [Required(ErrorMessage = "Appointment ID is required")]
    string AppointmentId,

    [Required(ErrorMessage = "New scheduled date is required")]
    DateTime NewScheduledDate,

    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
