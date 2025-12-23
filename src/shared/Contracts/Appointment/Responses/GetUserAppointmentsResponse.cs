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
/// Represents a single appointment/session item in the user's appointment list
/// </summary>
/// <param name="AppointmentId">Unique identifier for the appointment/session</param>
/// <param name="Title">Title of the appointment/session</param>
/// <param name="Description">Optional description</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment</param>
/// <param name="DurationMinutes">Duration of the appointment in minutes</param>
/// <param name="Status">Current status of the appointment</param>
/// <param name="OtherPartyUserId">User ID of the other party in the appointment</param>
/// <param name="OtherPartyName">Name of the other party in the appointment</param>
/// <param name="MeetingType">Type of meeting (VideoCall, InPerson, etc.)</param>
/// <param name="IsOrganizer">Indicates whether the current user is the organizer</param>
/// <param name="SkillId">Associated skill ID</param>
/// <param name="SkillName">Name of the associated skill</param>
/// <param name="MeetingLink">Meeting link (generated when both parties accept)</param>
/// <param name="ConnectionId">Connection ID (for new session-based appointments)</param>
/// <param name="ConnectionType">Type of connection (SkillExchange, Payment, Free)</param>
/// <param name="ConnectionStatus">Status of the connection</param>
/// <param name="SessionSeriesId">Session series ID (if part of a series)</param>
/// <param name="SessionSeriesTitle">Title of the session series</param>
/// <param name="SessionNumber">Session number within the series (1-based)</param>
/// <param name="TotalSessionsInSeries">Total number of sessions in the series</param>
/// <param name="CompletedSessionsInSeries">Number of completed sessions in the series</param>
/// <param name="IsConfirmed">Whether the session is confirmed by both parties</param>
/// <param name="IsPaymentCompleted">Whether payment is completed (for paid sessions)</param>
/// <param name="PaymentAmount">Payment amount (for paid sessions)</param>
/// <param name="Currency">Payment currency (for paid sessions)</param>
public record UserAppointmentItem(
    string AppointmentId,
    string Title,
    string? Description,
    DateTime ScheduledDate,
    int DurationMinutes,
    string Status,
    string OtherPartyUserId,
    string OtherPartyName,
    string MeetingType,
    bool IsOrganizer,
    string? SkillId,
    string? SkillName,
    string? MeetingLink,
    // Connection-level data (NEW - for session-based appointments)
    string? ConnectionId,
    string? ConnectionType,
    string? ConnectionStatus,
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
    bool IsMonetary);
