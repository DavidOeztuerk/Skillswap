using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for getting appointment details
/// </summary>
/// <param name="AppointmentId">ID of the appointment to retrieve</param>
public record GetAppointmentDetailsRequest(
    [Required(ErrorMessage = "Appointment ID is required")]
    string AppointmentId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
