namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for AcceptAppointment operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the accepted appointment</param>
/// <param name="Status">Current status of the appointment after acceptance</param>
/// <param name="AcceptedAt">Date and time when the appointment was accepted</param>
public record AcceptAppointmentResponse(
    string AppointmentId,
    string Status,
    DateTime AcceptedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
