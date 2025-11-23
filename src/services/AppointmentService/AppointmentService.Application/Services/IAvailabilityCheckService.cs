namespace AppointmentService.Application.Services;

/// <summary>
/// Service for checking user availability and detecting scheduling conflicts
/// </summary>
public interface IAvailabilityCheckService
{
    /// <summary>
    /// Checks if a user is available at a specific time
    /// </summary>
    /// <param name="userId">User ID to check availability for</param>
    /// <param name="startTime">Proposed start time (UTC)</param>
    /// <param name="durationMinutes">Duration of the proposed session</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if user is available, false if there's a conflict</returns>
    Task<bool> IsUserAvailableAsync(
        string userId,
        DateTime startTime,
        int durationMinutes,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all scheduling conflicts for a user in a specific time range
    /// </summary>
    /// <param name="userId">User ID to check conflicts for</param>
    /// <param name="startDate">Start of the date range (UTC)</param>
    /// <param name="endDate">End of the date range (UTC)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of all conflicts in the specified range</returns>
    Task<List<ConflictInfo>> GetConflictsAsync(
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Finds time slots where both users are available
    /// </summary>
    /// <param name="user1Id">First user ID</param>
    /// <param name="user2Id">Second user ID</param>
    /// <param name="preferredDays">Preferred days of the week</param>
    /// <param name="preferredTimes">Preferred time ranges</param>
    /// <param name="sessionsNeeded">Number of sessions to schedule</param>
    /// <param name="sessionDurationMinutes">Duration of each session</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of available time slots for both users</returns>
    Task<List<TimeSlot>> FindMutualAvailabilityAsync(
        string user1Id,
        string user2Id,
        string[] preferredDays,
        string[] preferredTimes,
        int sessionsNeeded,
        int sessionDurationMinutes,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a proposed time slot conflicts with existing appointments
    /// </summary>
    /// <param name="userId">User ID to check</param>
    /// <param name="proposedStart">Proposed start time (UTC)</param>
    /// <param name="proposedDuration">Proposed duration in minutes</param>
    /// <param name="excludeAppointmentId">Optional appointment ID to exclude from conflict check (for rescheduling)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Conflict information if there's a conflict, null if available</returns>
    Task<ConflictInfo?> CheckForConflictAsync(
        string userId,
        DateTime proposedStart,
        int proposedDuration,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Represents information about a scheduling conflict
/// </summary>
public record ConflictInfo
{
    /// <summary>
    /// ID of the conflicting appointment
    /// </summary>
    public string AppointmentId { get; init; } = string.Empty;

    /// <summary>
    /// Title of the conflicting appointment
    /// </summary>
    public string Title { get; init; } = string.Empty;

    /// <summary>
    /// Start time of the conflicting appointment (UTC)
    /// </summary>
    public DateTime StartTime { get; init; }

    /// <summary>
    /// End time of the conflicting appointment (UTC)
    /// </summary>
    public DateTime EndTime { get; init; }

    /// <summary>
    /// Duration in minutes
    /// </summary>
    public int DurationMinutes { get; init; }

    /// <summary>
    /// Status of the conflicting appointment
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>
    /// Whether this is a confirmed appointment (higher priority)
    /// </summary>
    public bool IsConfirmed { get; init; }

    /// <summary>
    /// User ID of the other party in the conflicting appointment
    /// </summary>
    public string OtherPartyUserId { get; init; } = string.Empty;

    /// <summary>
    /// Severity of the conflict
    /// </summary>
    public ConflictSeverity Severity { get; init; }
}

/// <summary>
/// Represents a time slot available for scheduling
/// </summary>
public record TimeSlot
{
    /// <summary>
    /// Start time of the slot (UTC)
    /// </summary>
    public DateTime StartTime { get; init; }

    /// <summary>
    /// Duration of the slot in minutes
    /// </summary>
    public int DurationMinutes { get; init; }

    /// <summary>
    /// End time of the slot (UTC)
    /// </summary>
    public DateTime EndTime => StartTime.AddMinutes(DurationMinutes);

    /// <summary>
    /// Day of the week for this slot
    /// </summary>
    public DayOfWeek DayOfWeek => StartTime.DayOfWeek;

    /// <summary>
    /// Whether this slot has any conflicts (for informational purposes)
    /// </summary>
    public bool HasConflict { get; init; }

    /// <summary>
    /// Conflict details if HasConflict is true
    /// </summary>
    public ConflictInfo? Conflict { get; init; }

    public TimeSlot(DateTime startTime, int durationMinutes)
    {
        StartTime = startTime;
        DurationMinutes = durationMinutes;
        HasConflict = false;
        Conflict = null;
    }

    public TimeSlot(DateTime startTime, int durationMinutes, ConflictInfo? conflict)
    {
        StartTime = startTime;
        DurationMinutes = durationMinutes;
        HasConflict = conflict != null;
        Conflict = conflict;
    }
}

/// <summary>
/// Severity level of a scheduling conflict
/// </summary>
public enum ConflictSeverity
{
    /// <summary>
    /// No conflict
    /// </summary>
    None = 0,

    /// <summary>
    /// Minor conflict with a pending or tentative appointment
    /// </summary>
    Minor = 1,

    /// <summary>
    /// Moderate conflict with a confirmed appointment
    /// </summary>
    Moderate = 2,

    /// <summary>
    /// Major conflict with an in-progress or payment-completed appointment
    /// </summary>
    Major = 3
}
