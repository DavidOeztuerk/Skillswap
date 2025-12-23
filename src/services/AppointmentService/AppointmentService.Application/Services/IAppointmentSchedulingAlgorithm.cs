namespace AppointmentService.Application.Services;

/// <summary>
/// Service for intelligently scheduling appointments based on user preferences and availability
/// </summary>
public interface IAppointmentSchedulingAlgorithm
{
    /// <summary>
    /// Generates concrete appointment time slots based on scheduling request
    /// </summary>
    /// <param name="request">Scheduling request with user IDs, preferences, and requirements</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of proposed appointment slots</returns>
    Task<List<ProposedAppointment>> GenerateAppointmentSlotsAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates if a scheduling request is feasible
    /// </summary>
    /// <param name="request">Scheduling request to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with feasibility information</returns>
    Task<SchedulingFeasibilityResult> ValidateFeasibilityAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates alternative scheduling suggestions if primary preferences aren't feasible
    /// </summary>
    /// <param name="request">Original scheduling request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of alternative scheduling options</returns>
    Task<List<AlternativeSchedulingOption>> GenerateAlternativesAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Request object for scheduling appointments
/// </summary>
public record SchedulingRequest
{
    /// <summary>
    /// ID of the user who initiated the request
    /// </summary>
    public string RequesterId { get; init; } = string.Empty;

    /// <summary>
    /// ID of the target user
    /// </summary>
    public string TargetUserId { get; init; } = string.Empty;

    /// <summary>
    /// Preferred days of the week (e.g., ["Monday", "Wednesday", "Friday"])
    /// </summary>
    public string[] PreferredDays { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Preferred time ranges (e.g., ["18:00-20:00", "14:00-16:00"])
    /// </summary>
    public string[] PreferredTimes { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Total number of sessions to schedule
    /// </summary>
    public int TotalSessions { get; init; }

    /// <summary>
    /// Duration of each session in minutes
    /// </summary>
    public int SessionDurationMinutes { get; init; }

    /// <summary>
    /// Earliest date to start scheduling (UTC)
    /// </summary>
    public DateTime EarliestStartDate { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Latest date to schedule appointments (UTC), null for no limit
    /// </summary>
    public DateTime? LatestEndDate { get; init; }

    /// <summary>
    /// Whether this is a skill exchange (requires alternating teacher/learner)
    /// </summary>
    public bool IsSkillExchange { get; init; }

    /// <summary>
    /// Minimum days between sessions (default: 1)
    /// </summary>
    public int MinimumDaysBetweenSessions { get; init; } = 1;

    /// <summary>
    /// Maximum days between sessions (default: 14)
    /// </summary>
    public int MaximumDaysBetweenSessions { get; init; } = 14;

    /// <summary>
    /// Whether to distribute sessions evenly over time
    /// </summary>
    public bool DistributeEvenly { get; init; } = true;
}

/// <summary>
/// Represents a proposed appointment slot
/// </summary>
public record ProposedAppointment
{
    /// <summary>
    /// Scheduled date and time (UTC)
    /// </summary>
    public DateTime ScheduledDate { get; init; }

    /// <summary>
    /// Duration in minutes
    /// </summary>
    public int DurationMinutes { get; init; }

    /// <summary>
    /// Session number in the series (1, 2, 3, etc.)
    /// </summary>
    public int SessionNumber { get; init; }

    /// <summary>
    /// User ID of the organizer/teacher
    /// </summary>
    public string OrganizerUserId { get; init; } = string.Empty;

    /// <summary>
    /// User ID of the participant/learner
    /// </summary>
    public string ParticipantUserId { get; init; } = string.Empty;

    /// <summary>
    /// Conflict level for this slot
    /// </summary>
    public ConflictLevel ConflictLevel { get; init; } = ConflictLevel.None;

    /// <summary>
    /// Conflict information if ConflictLevel != None
    /// </summary>
    public ConflictInfo? Conflict { get; init; }

    /// <summary>
    /// Confidence score (0.0 - 1.0) for this slot based on preferences match
    /// </summary>
    public double ConfidenceScore { get; init; } = 1.0;

    /// <summary>
    /// Notes about this proposed slot (e.g., "Outside preferred hours but best available")
    /// </summary>
    public string? Notes { get; init; }
}

/// <summary>
/// Result of scheduling feasibility validation
/// </summary>
public record SchedulingFeasibilityResult
{
    /// <summary>
    /// Whether the scheduling request is feasible
    /// </summary>
    public bool IsFeasible { get; init; }

    /// <summary>
    /// Number of slots that can be scheduled
    /// </summary>
    public int AvailableSlots { get; init; }

    /// <summary>
    /// Number of slots requested
    /// </summary>
    public int RequestedSlots { get; init; }

    /// <summary>
    /// Percentage of requested slots that can be fulfilled (0.0 - 1.0)
    /// </summary>
    public double FulfillmentPercentage => RequestedSlots > 0
        ? (double)AvailableSlots / RequestedSlots
        : 0.0;

    /// <summary>
    /// List of reasons why scheduling might not be fully feasible
    /// </summary>
    public List<string> Warnings { get; init; } = new();

    /// <summary>
    /// Recommendations for improving feasibility
    /// </summary>
    public List<string> Recommendations { get; init; } = new();

    /// <summary>
    /// Conflicts found during feasibility check
    /// </summary>
    public List<ConflictInfo> Conflicts { get; init; } = new();
}

/// <summary>
/// Alternative scheduling option when primary preferences aren't fully feasible
/// </summary>
public record AlternativeSchedulingOption
{
    /// <summary>
    /// Description of this alternative (e.g., "Add Tuesday to available days")
    /// </summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Modified preferred days for this alternative
    /// </summary>
    public string[]? AlternativeDays { get; init; }

    /// <summary>
    /// Modified preferred times for this alternative
    /// </summary>
    public string[]? AlternativeTimes { get; init; }

    /// <summary>
    /// Number of slots available with this alternative
    /// </summary>
    public int AvailableSlots { get; init; }

    /// <summary>
    /// Confidence score for this alternative (0.0 - 1.0)
    /// </summary>
    public double ConfidenceScore { get; init; }

    /// <summary>
    /// How much this deviates from original preferences (0.0 = perfect match, 1.0 = completely different)
    /// </summary>
    public double DeviationScore { get; init; }
}

/// <summary>
/// Conflict level for a proposed appointment
/// </summary>
public enum ConflictLevel
{
    /// <summary>
    /// No conflict
    /// </summary>
    None = 0,

    /// <summary>
    /// Minor conflict with low-priority appointment
    /// </summary>
    Minor = 1,

    /// <summary>
    /// Moderate conflict with confirmed appointment
    /// </summary>
    Moderate = 2,

    /// <summary>
    /// Major conflict with high-priority appointment
    /// </summary>
    Major = 3
}
