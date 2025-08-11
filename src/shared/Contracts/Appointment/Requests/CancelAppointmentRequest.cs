using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for canceling an appointment
/// </summary>
/// <param name="Reason">Optional reason for cancellation</param>
/// <remarks>
/// AppointmentId is now provided via route parameter
/// </remarks>
public record CancelAppointmentRequest(
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}