using System.Text.Json;

namespace SkillService.Domain.ValueObjects;

/// <summary>
/// Value Object for skill scheduling configuration.
/// Stored as owned entity in Skill table.
/// </summary>
public class SkillScheduling
{
    /// <summary>
    /// Preferred days for sessions (JSON array: ["monday", "tuesday", ...])
    /// </summary>
    public string? PreferredDaysJson { get; private set; }

    /// <summary>
    /// Preferred times for sessions (JSON array: ["morning", "afternoon", "evening"])
    /// </summary>
    public string? PreferredTimesJson { get; private set; }

    /// <summary>
    /// Duration of each session in minutes (15, 30, 45, 60, 90, 120)
    /// </summary>
    public int SessionDurationMinutes { get; private set; } = 60;

    /// <summary>
    /// Total number of sessions needed to teach/learn this skill
    /// </summary>
    public int TotalSessions { get; private set; } = 1;

    // Required for EF Core
    private SkillScheduling() { }

    public static SkillScheduling Create(
        List<string>? preferredDays = null,
        List<string>? preferredTimes = null,
        int sessionDurationMinutes = 60,
        int totalSessions = 1)
    {
        return new SkillScheduling
        {
            PreferredDaysJson = preferredDays != null ? JsonSerializer.Serialize(preferredDays) : null,
            PreferredTimesJson = preferredTimes != null ? JsonSerializer.Serialize(preferredTimes) : null,
            SessionDurationMinutes = sessionDurationMinutes,
            TotalSessions = totalSessions
        };
    }

    public static SkillScheduling Default() => Create();

    // Helper properties for deserialization
    public List<string> PreferredDays
    {
        get => string.IsNullOrEmpty(PreferredDaysJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(PreferredDaysJson) ?? new List<string>();
    }

    public List<string> PreferredTimes
    {
        get => string.IsNullOrEmpty(PreferredTimesJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(PreferredTimesJson) ?? new List<string>();
    }

    public void Update(
        List<string>? preferredDays,
        List<string>? preferredTimes,
        int sessionDurationMinutes,
        int totalSessions)
    {
        PreferredDaysJson = preferredDays != null ? JsonSerializer.Serialize(preferredDays) : null;
        PreferredTimesJson = preferredTimes != null ? JsonSerializer.Serialize(preferredTimes) : null;
        SessionDurationMinutes = sessionDurationMinutes;
        TotalSessions = totalSessions;
    }

    public void SetPreferredDays(List<string> days)
    {
        PreferredDaysJson = JsonSerializer.Serialize(days);
    }

    public void SetPreferredTimes(List<string> times)
    {
        PreferredTimesJson = JsonSerializer.Serialize(times);
    }
}
