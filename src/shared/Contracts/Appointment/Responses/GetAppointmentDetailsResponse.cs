namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for GetAppointmentDetails operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the appointment</param>
/// <param name="Title">Title of the appointment</param>
/// <param name="Description">Description of the appointment</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment (ISO-8601 format with timezone)</param>
/// <param name="DurationMinutes">Duration of the appointment in minutes</param>
/// <param name="OrganizerUserId">User ID of the appointment organizer</param>
/// <param name="OrganizerName">Name of the appointment organizer</param>
/// <param name="ParticipantUserId">User ID of the appointment participant</param>
/// <param name="ParticipantName">Name of the appointment participant</param>
/// <param name="Status">Current status of the appointment</param>
/// <param name="SkillId">Associated skill ID if applicable</param>
/// <param name="SkillName">Name of the associated skill if applicable</param>
/// <param name="MatchId">Associated match ID if applicable</param>
/// <param name="MeetingType">Type of meeting (VideoCall, InPerson, etc.)</param>
/// <param name="MeetingLink">Link for the meeting (generated after both parties accept)</param>
/// <param name="CreatedAt">Date and time when the appointment was created (ISO-8601 format with timezone)</param>
/// <param name="UpdatedAt">Date and time when the appointment was last updated (ISO-8601 format with timezone)</param>
/// <param name="AcceptedAt">Date and time when the appointment was accepted (ISO-8601 format with timezone)</param>
/// <param name="CompletedAt">Date and time when the appointment was completed (ISO-8601 format with timezone)</param>
/// <param name="CancelledAt">Date and time when the appointment was cancelled (ISO-8601 format with timezone)</param>
/// <param name="CancellationReason">Reason for cancellation if cancelled</param>
public record GetAppointmentDetailsResponse(
    string AppointmentId,
    string Title,
    string? Description,
    DateTimeOffset ScheduledDate,
    int DurationMinutes,
    string OrganizerUserId,
    string OrganizerName,
    string ParticipantUserId,
    string ParticipantName,
    string Status,
    string? SkillId,
    string? SkillName,
    string? MatchId,
    string MeetingType,
    string? MeetingLink,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
