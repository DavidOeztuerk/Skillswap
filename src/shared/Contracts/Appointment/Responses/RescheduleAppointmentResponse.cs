namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for RescheduleAppointment operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the rescheduled appointment</param>
/// <param name="NewScheduledDate">New scheduled date and time for the appointment (ISO-8601 format with timezone)</param>
/// <param name="NewDurationMinutes">New duration in minutes for the appointment</param>
/// <param name="UpdatedAt">Date and time when the appointment was rescheduled (ISO-8601 format with timezone)</param>
public record RescheduleAppointmentResponse(
    string AppointmentId,
    DateTimeOffset NewScheduledDate,
    int NewDurationMinutes,
    DateTimeOffset UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
