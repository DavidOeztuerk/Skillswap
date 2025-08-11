namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for accepting an appointment
/// </summary>
/// <remarks>
/// AppointmentId is now provided via route parameter
/// This request body can contain additional acceptance details in the future
/// </remarks>
public record AcceptAppointmentRequest()
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}