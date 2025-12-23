namespace AppointmentService.Application.Services;

/// <summary>
/// Service for parsing and processing preferred time preferences from users
/// </summary>
public interface IPreferredTimeParser
{
    /// <summary>
    /// Parses day names (e.g., "Monday", "Wednesday") into DayOfWeek enum values
    /// </summary>
    /// <param name="preferredDays">Array of day names (e.g., ["Monday", "Wednesday", "Friday"])</param>
    /// <returns>List of parsed DayOfWeek values</returns>
    List<DayOfWeek> ParseDays(string[] preferredDays);

    /// <summary>
    /// Parses time range strings (e.g., "18:00-20:00") into TimeRange objects
    /// </summary>
    /// <param name="preferredTimes">Array of time ranges (e.g., ["18:00-20:00", "14:00-16:00"])</param>
    /// <returns>List of parsed TimeRange objects</returns>
    List<TimeRange> ParseTimeRanges(string[] preferredTimes);

    /// <summary>
    /// Generates concrete DateTime slots based on preferred days, times, and duration
    /// </summary>
    /// <param name="days">List of preferred days of week</param>
    /// <param name="timeRanges">List of preferred time ranges</param>
    /// <param name="durationMinutes">Session duration in minutes</param>
    /// <param name="startFrom">Earliest possible start date</param>
    /// <param name="weeksToGenerate">Number of weeks to generate slots for (default: 4)</param>
    /// <returns>List of potential DateTime slots</returns>
    List<DateTime> GeneratePotentialSlots(
        List<DayOfWeek> days,
        List<TimeRange> timeRanges,
        int durationMinutes,
        DateTime startFrom,
        int weeksToGenerate = 4);

    /// <summary>
    /// Validates if the preferred days and times are in correct format
    /// </summary>
    /// <param name="preferredDays">Array of day names to validate</param>
    /// <param name="preferredTimes">Array of time ranges to validate</param>
    /// <returns>Validation result with error messages if invalid</returns>
    ValidationResult Validate(string[] preferredDays, string[] preferredTimes);
}

/// <summary>
/// Represents a time range with start and end times
/// </summary>
public record TimeRange(TimeSpan Start, TimeSpan End)
{
    /// <summary>
    /// Checks if a specific time falls within this range
    /// </summary>
    public bool Contains(TimeSpan time) => time >= Start && time <= End;

    /// <summary>
    /// Gets the duration of this time range in minutes
    /// </summary>
    public int DurationMinutes => (int)(End - Start).TotalMinutes;

    /// <summary>
    /// Checks if this time range overlaps with another
    /// </summary>
    public bool OverlapsWith(TimeRange other) =>
        Start < other.End && End > other.Start;
}

/// <summary>
/// Validation result for preferred time parsing
/// </summary>
public record ValidationResult(bool IsValid, List<string> Errors)
{
    public static ValidationResult Success() => new(true, new List<string>());

    public static ValidationResult Failure(params string[] errors) =>
        new(false, errors.ToList());

    public void AddError(string error) => Errors.Add(error);
}
