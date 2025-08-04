namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for GetUserAppointments operation
/// </summary>
/// <param name="Appointments">Paginated list of user appointments</param>
public record GetUserAppointmentsResponse(
    List<UserAppointmentItem> Appointments)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Represents a single appointment item in the user's appointment list
/// </summary>
/// <param name="AppointmentId">Unique identifier for the appointment</param>
/// <param name="Title">Title of the appointment</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment</param>
/// <param name="DurationMinutes">Duration of the appointment in minutes</param>
/// <param name="Status">Current status of the appointment</param>
/// <param name="OtherPartyUserId">User ID of the other party in the appointment</param>
/// <param name="OtherPartyName">Name of the other party in the appointment</param>
/// <param name="MeetingType">Type of meeting (VideoCall, InPerson, etc.)</param>
/// <param name="IsOrganizer">Indicates whether the current user is the organizer</param>
public record UserAppointmentItem(
    string AppointmentId,
    string Title,
    DateTime ScheduledDate,
    int DurationMinutes,
    string Status,
    string OtherPartyUserId,
    string OtherPartyName,
    string MeetingType,
    bool IsOrganizer);
