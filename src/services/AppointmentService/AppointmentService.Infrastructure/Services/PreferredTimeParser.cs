using AppointmentService.Application.Services;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text.RegularExpressions;

namespace AppointmentService.Infrastructure.Services;

/// <summary>
/// Implementation of IPreferredTimeParser for parsing user time preferences
/// </summary>
public class PreferredTimeParser : IPreferredTimeParser
{
    private readonly ILogger<PreferredTimeParser> _logger;

    // Regex pattern for validating time ranges: "HH:MM-HH:MM"
    private static readonly Regex TimeRangePattern = new Regex(
        @"^([0-1]?[0-9]|2[0-3]):([0-5][0-9])-([0-1]?[0-9]|2[0-3]):([0-5][0-9])$",
        RegexOptions.Compiled);

    // Mapping of day names to DayOfWeek (case-insensitive)
    private static readonly Dictionary<string, DayOfWeek> DayNameMapping = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Monday", DayOfWeek.Monday },
        { "Tuesday", DayOfWeek.Tuesday },
        { "Wednesday", DayOfWeek.Wednesday },
        { "Thursday", DayOfWeek.Thursday },
        { "Friday", DayOfWeek.Friday },
        { "Saturday", DayOfWeek.Saturday },
        { "Sunday", DayOfWeek.Sunday },
        // German names support
        { "Montag", DayOfWeek.Monday },
        { "Dienstag", DayOfWeek.Tuesday },
        { "Mittwoch", DayOfWeek.Wednesday },
        { "Donnerstag", DayOfWeek.Thursday },
        { "Freitag", DayOfWeek.Friday },
        { "Samstag", DayOfWeek.Saturday },
        { "Sonntag", DayOfWeek.Sunday }
    };

    public PreferredTimeParser(ILogger<PreferredTimeParser> logger)
    {
        _logger = logger;
    }

    public List<DayOfWeek> ParseDays(string[] preferredDays)
    {
        if (preferredDays == null || preferredDays.Length == 0)
        {
            _logger.LogWarning("No preferred days provided, using all weekdays as default");
            return new List<DayOfWeek>
            {
                DayOfWeek.Monday,
                DayOfWeek.Tuesday,
                DayOfWeek.Wednesday,
                DayOfWeek.Thursday,
                DayOfWeek.Friday
            };
        }

        var parsedDays = new List<DayOfWeek>();

        foreach (var dayName in preferredDays)
        {
            if (string.IsNullOrWhiteSpace(dayName))
            {
                _logger.LogWarning("Empty day name in preferred days array, skipping");
                continue;
            }

            if (DayNameMapping.TryGetValue(dayName.Trim(), out var dayOfWeek))
            {
                if (!parsedDays.Contains(dayOfWeek))
                {
                    parsedDays.Add(dayOfWeek);
                }
            }
            else
            {
                _logger.LogWarning("Unknown day name '{DayName}' in preferred days, skipping", dayName);
            }
        }

        if (parsedDays.Count == 0)
        {
            _logger.LogWarning("No valid days parsed, using all weekdays as fallback");
            return new List<DayOfWeek>
            {
                DayOfWeek.Monday,
                DayOfWeek.Tuesday,
                DayOfWeek.Wednesday,
                DayOfWeek.Thursday,
                DayOfWeek.Friday
            };
        }

        _logger.LogDebug("Parsed {Count} preferred days: {Days}", parsedDays.Count, string.Join(", ", parsedDays));
        return parsedDays;
    }

    public List<TimeRange> ParseTimeRanges(string[] preferredTimes)
    {
        if (preferredTimes == null || preferredTimes.Length == 0)
        {
            _logger.LogWarning("No preferred times provided, using 09:00-17:00 as default");
            return new List<TimeRange>
            {
                new TimeRange(new TimeSpan(9, 0, 0), new TimeSpan(17, 0, 0))
            };
        }

        var parsedRanges = new List<TimeRange>();

        foreach (var timeRangeStr in preferredTimes)
        {
            if (string.IsNullOrWhiteSpace(timeRangeStr))
            {
                _logger.LogWarning("Empty time range in preferred times array, skipping");
                continue;
            }

            var trimmed = timeRangeStr.Trim();
            var match = TimeRangePattern.Match(trimmed);

            if (!match.Success)
            {
                _logger.LogWarning("Invalid time range format '{TimeRange}', expected 'HH:MM-HH:MM', skipping", trimmed);
                continue;
            }

            try
            {
                var startHour = int.Parse(match.Groups[1].Value);
                var startMinute = int.Parse(match.Groups[2].Value);
                var endHour = int.Parse(match.Groups[3].Value);
                var endMinute = int.Parse(match.Groups[4].Value);

                var start = new TimeSpan(startHour, startMinute, 0);
                var end = new TimeSpan(endHour, endMinute, 0);

                if (start >= end)
                {
                    _logger.LogWarning("Invalid time range '{TimeRange}': start time must be before end time, skipping", trimmed);
                    continue;
                }

                var range = new TimeRange(start, end);
                parsedRanges.Add(range);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing time range '{TimeRange}', skipping", trimmed);
            }
        }

        if (parsedRanges.Count == 0)
        {
            _logger.LogWarning("No valid time ranges parsed, using 09:00-17:00 as fallback");
            return new List<TimeRange>
            {
                new TimeRange(new TimeSpan(9, 0, 0), new TimeSpan(17, 0, 0))
            };
        }

        _logger.LogDebug("Parsed {Count} time ranges", parsedRanges.Count);
        return parsedRanges;
    }

    public List<DateTime> GeneratePotentialSlots(
        List<DayOfWeek> days,
        List<TimeRange> timeRanges,
        int durationMinutes,
        DateTime startFrom,
        int weeksToGenerate = 4)
    {
        if (days == null || days.Count == 0)
        {
            throw new ArgumentException("Days list cannot be null or empty", nameof(days));
        }

        if (timeRanges == null || timeRanges.Count == 0)
        {
            throw new ArgumentException("Time ranges list cannot be null or empty", nameof(timeRanges));
        }

        if (durationMinutes <= 0)
        {
            throw new ArgumentException("Duration must be positive", nameof(durationMinutes));
        }

        if (weeksToGenerate <= 0)
        {
            throw new ArgumentException("Weeks to generate must be positive", nameof(weeksToGenerate));
        }

        var slots = new List<DateTime>();
        var currentDate = startFrom.Date; // Start at beginning of day
        var endDate = currentDate.AddDays(weeksToGenerate * 7);

        _logger.LogDebug(
            "Generating slots from {StartDate} to {EndDate} for {DayCount} days and {RangeCount} time ranges",
            currentDate, endDate, days.Count, timeRanges.Count);

        while (currentDate < endDate)
        {
            // Check if current day is in preferred days
            if (days.Contains(currentDate.DayOfWeek))
            {
                // Generate slots for each time range
                foreach (var timeRange in timeRanges)
                {
                    // Generate slots within this time range with the given duration
                    var currentTime = timeRange.Start;
                    var sessionDuration = TimeSpan.FromMinutes(durationMinutes);

                    while (currentTime.Add(sessionDuration) <= timeRange.End)
                    {
                        var slotDateTime = currentDate.Add(currentTime);

                        // Only add future slots
                        if (slotDateTime > DateTime.UtcNow)
                        {
                            slots.Add(slotDateTime);
                        }

                        // Move to next slot (with 30 min spacing between slots)
                        currentTime = currentTime.Add(sessionDuration).Add(TimeSpan.FromMinutes(30));
                    }
                }
            }

            currentDate = currentDate.AddDays(1);
        }

        _logger.LogInformation("Generated {Count} potential time slots", slots.Count);
        return slots.OrderBy(s => s).ToList();
    }

    public ValidationResult Validate(string[] preferredDays, string[] preferredTimes)
    {
        var result = ValidationResult.Success();

        // Validate days
        if (preferredDays != null && preferredDays.Length > 0)
        {
            foreach (var day in preferredDays)
            {
                if (string.IsNullOrWhiteSpace(day))
                {
                    result.AddError("Day name cannot be empty");
                    continue;
                }

                if (!DayNameMapping.ContainsKey(day.Trim()))
                {
                    result.AddError($"Invalid day name: '{day}'. Valid values are: Monday-Sunday or Montag-Sonntag");
                }
            }
        }

        // Validate time ranges
        if (preferredTimes != null && preferredTimes.Length > 0)
        {
            foreach (var timeRange in preferredTimes)
            {
                if (string.IsNullOrWhiteSpace(timeRange))
                {
                    result.AddError("Time range cannot be empty");
                    continue;
                }

                var match = TimeRangePattern.Match(timeRange.Trim());
                if (!match.Success)
                {
                    result.AddError($"Invalid time range format: '{timeRange}'. Expected format: 'HH:MM-HH:MM' (e.g., '09:00-17:00')");
                    continue;
                }

                try
                {
                    var startHour = int.Parse(match.Groups[1].Value);
                    var startMinute = int.Parse(match.Groups[2].Value);
                    var endHour = int.Parse(match.Groups[3].Value);
                    var endMinute = int.Parse(match.Groups[4].Value);

                    var start = new TimeSpan(startHour, startMinute, 0);
                    var end = new TimeSpan(endHour, endMinute, 0);

                    if (start >= end)
                    {
                        result.AddError($"Invalid time range '{timeRange}': start time must be before end time");
                    }
                }
                catch (Exception)
                {
                    result.AddError($"Error parsing time range: '{timeRange}'");
                }
            }
        }

        return result with { IsValid = result.Errors.Count == 0 };
    }
}
