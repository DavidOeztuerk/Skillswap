using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for accepting an appointment
/// </summary>
/// <param name="AppointmentId">ID of the appointment to accept</param>
public record AcceptAppointmentRequest(
    [Required(ErrorMessage = "Appointment ID is required")]
    string AppointmentId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
