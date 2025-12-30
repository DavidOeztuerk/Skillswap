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
/// <param name="ConnectionId">Connection ID (for new session-based appointments)</param>
/// <param name="ConnectionType">Type of connection (SkillExchange, Payment, Free)</param>
/// <param name="ConnectionStatus">Status of the connection</param>
/// <param name="MatchRequesterId">User ID of the original match requester (INITIATOR - constant through the chain)</param>
/// <param name="MatchRequesterName">Name of the original match requester</param>
/// <param name="MatchTargetUserId">User ID of the skill owner (PARTICIPANT - constant through the chain)</param>
/// <param name="MatchTargetUserName">Name of the skill owner</param>
/// <param name="SessionSeriesId">Session series ID (if part of a series)</param>
/// <param name="SessionSeriesTitle">Title of the session series</param>
/// <param name="SessionNumber">Session number within the series (1-based)</param>
/// <param name="TotalSessionsInSeries">Total number of sessions in the series</param>
/// <param name="CompletedSessionsInSeries">Number of completed sessions in the series</param>
/// <param name="IsConfirmed">Whether the session is confirmed by both parties</param>
/// <param name="IsPaymentCompleted">Whether payment is completed (for paid sessions)</param>
/// <param name="PaymentAmount">Payment amount (for paid sessions)</param>
/// <param name="Currency">Payment currency (for paid sessions)</param>
/// <param name="IsSkillExchange">Whether this is a skill exchange session</param>
/// <param name="IsMonetary">Whether this is a paid session</param>
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
    string? CancellationReason,
    // Connection-level data (NEW - for session-based appointments)
    string? ConnectionId,
    string? ConnectionType,
    string? ConnectionStatus,
    // Chat/Thread info - ThreadId from MatchRequest for Chat integration
    string? ThreadId,
    // Match/Connection Rollen - KONSTANT durch die gesamte Kette
    string? MatchRequesterId,
    string? MatchRequesterName,
    string? MatchTargetUserId,
    string? MatchTargetUserName,
    // Series-level data (NEW - for session series)
    string? SessionSeriesId,
    string? SessionSeriesTitle,
    int? SessionNumber,
    int? TotalSessionsInSeries,
    int? CompletedSessionsInSeries,
    // Session-specific data (NEW)
    bool IsConfirmed,
    bool IsPaymentCompleted,
    decimal? PaymentAmount,
    string? Currency,
    // Derived flags for frontend compatibility
    bool IsSkillExchange,
    bool IsMonetary)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
