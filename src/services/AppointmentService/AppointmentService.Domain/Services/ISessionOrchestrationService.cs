using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Services;

/// <summary>
/// Orchestrates the creation and management of the session hierarchy:
/// Connection → SessionSeries → SessionAppointments
/// </summary>
public interface ISessionOrchestrationService
{
    /// <summary>
    /// Creates the complete session hierarchy when a match is accepted
    /// </summary>
    /// <param name="matchRequestId">The MatchRequest ID that originated this connection</param>
    /// <param name="threadId">ThreadId from MatchRequest (SHA256-GUID format) for Chat integration</param>
    Task<Connection> CreateSessionHierarchyFromMatchAsync(
        string matchRequestId,
        string? threadId,
        string requesterId,
        string targetUserId,
        string skillId,
        bool isSkillExchange,
        string? exchangeSkillId,
        bool isMonetary,
        decimal? offeredAmount,
        string? currency,
        int totalSessions,
        int sessionDurationMinutes,
        string[] preferredDays,
        string[] preferredTimes,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new session series within an existing connection
    /// </summary>
    Task<SessionSeries> CreateSessionSeriesAsync(
        string connectionId,
        string title,
        string teacherUserId,
        string learnerUserId,
        string skillId,
        int totalSessions,
        int defaultDurationMinutes = 60,
        string? description = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Schedules a new session appointment within a series
    /// </summary>
    Task<SessionAppointment> ScheduleSessionAsync(
        string sessionSeriesId,
        string title,
        DateTime scheduledDate,
        int durationMinutes,
        string organizerUserId,
        string participantUserId,
        string? description = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Completes a session and updates all related entities
    /// </summary>
    Task CompleteSessionAsync(
        string sessionAppointmentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancels a session and handles all cascade effects
    /// </summary>
    Task CancelSessionAsync(
        string sessionAppointmentId,
        string cancelledByUserId,
        string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Requests reschedule for a session
    /// </summary>
    Task RequestRescheduleAsync(
        string sessionAppointmentId,
        string requestedByUserId,
        DateTime proposedDate,
        int? proposedDuration,
        string reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves a reschedule request
    /// </summary>
    Task ApproveRescheduleAsync(
        string sessionAppointmentId,
        string approvedByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Rejects a reschedule request
    /// </summary>
    Task RejectRescheduleAsync(
        string sessionAppointmentId,
        string rejectedByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a session as no-show
    /// </summary>
    Task MarkAsNoShowAsync(
        string sessionAppointmentId,
        string noShowUserIds,
        string reportedByUserId,
        CancellationToken cancellationToken = default);
}
