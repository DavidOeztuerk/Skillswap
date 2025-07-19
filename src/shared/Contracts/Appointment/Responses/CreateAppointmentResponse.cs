namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for CreateAppointment operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the created appointment</param>
/// <param name="Title">Title of the appointment</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment</param>
/// <param name="Status">Current status of the appointment</param>
/// <param name="CreatedAt">Date and time when the appointment was created</param>
public record CreateAppointmentResponse(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    string Status,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
