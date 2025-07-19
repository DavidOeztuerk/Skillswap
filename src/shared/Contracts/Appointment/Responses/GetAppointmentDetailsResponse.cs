namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for GetAppointmentDetails operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the appointment</param>
/// <param name="Title">Title of the appointment</param>
/// <param name="Description">Description of the appointment</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment</param>
/// <param name="DurationMinutes">Duration of the appointment in minutes</param>
/// <param name="OrganizerUserId">User ID of the appointment organizer</param>
/// <param name="OrganizerName">Name of the appointment organizer</param>
/// <param name="ParticipantUserId">User ID of the appointment participant</param>
/// <param name="ParticipantName">Name of the appointment participant</param>
/// <param name="Status">Current status of the appointment</param>
/// <param name="SkillId">Associated skill ID if applicable</param>
/// <param name="MatchId">Associated match ID if applicable</param>
/// <param name="MeetingType">Type of meeting (VideoCall, InPerson, etc.)</param>
/// <param name="MeetingLink">Link for the meeting if applicable</param>
/// <param name="Location">Location of the meeting if applicable</param>
/// <param name="CreatedAt">Date and time when the appointment was created</param>
/// <param name="AcceptedAt">Date and time when the appointment was accepted</param>
/// <param name="CompletedAt">Date and time when the appointment was completed</param>
/// <param name="CancelledAt">Date and time when the appointment was cancelled</param>
public record GetAppointmentDetailsResponse(
    string AppointmentId,
    string Title,
    string? Description,
    DateTime ScheduledDate,
    int DurationMinutes,
    string OrganizerUserId,
    string OrganizerName,
    string ParticipantUserId,
    string ParticipantName,
    string Status,
    string? SkillId,
    string? MatchId,
    string MeetingType,
    string? MeetingLink,
    string? Location,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
