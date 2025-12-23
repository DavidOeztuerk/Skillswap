using Infrastructure.Communication;
using Microsoft.Extensions.Logging;

namespace NotificationService.Infrastructure.Services;

/// <summary>
/// Service for calculating mutual availability between two users
/// considering their external calendar busy times
/// </summary>
public interface IMutualAvailabilityService
{
    /// <summary>
    /// Find mutual free time slots for two users
    /// </summary>
    /// <param name="user1Id">First user ID</param>
    /// <param name="user2Id">Second user ID</param>
    /// <param name="startDate">Start of the date range to check</param>
    /// <param name="endDate">End of the date range to check</param>
    /// <param name="sessionDurationMinutes">Duration of each session slot</param>
    /// <param name="maxSlots">Maximum number of slots to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of available time slots</returns>
    Task<MutualAvailabilityResult> FindMutualAvailabilityAsync(
        string user1Id,
        string user2Id,
        DateTime startDate,
        DateTime endDate,
        int sessionDurationMinutes = 60,
        int maxSlots = 5,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of mutual availability calculation
/// </summary>
public record MutualAvailabilityResult
{
    /// <summary>
    /// Whether the calculation was successful
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Error message if calculation failed
    /// </summary>
    public string? Error { get; init; }

    /// <summary>
    /// Available time slots for both users
    /// </summary>
    public List<AvailableSlot> AvailableSlots { get; init; } = [];

    /// <summary>
    /// Whether user 1 has connected calendars
    /// </summary>
    public bool User1HasCalendar { get; init; }

    /// <summary>
    /// Whether user 2 has connected calendars
    /// </summary>
    public bool User2HasCalendar { get; init; }

    public static MutualAvailabilityResult Succeeded(
        List<AvailableSlot> slots,
        bool user1HasCalendar,
        bool user2HasCalendar) =>
        new()
        {
            Success = true,
            AvailableSlots = slots,
            User1HasCalendar = user1HasCalendar,
            User2HasCalendar = user2HasCalendar
        };

    public static MutualAvailabilityResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// Represents an available time slot
/// </summary>
public record AvailableSlot
{
    public DateTime Start { get; init; }
    public DateTime End { get; init; }
    public string DayOfWeek { get; init; } = string.Empty;
    public string FormattedDate { get; init; } = string.Empty;
    public string FormattedTime { get; init; } = string.Empty;
}

/// <summary>
/// Response from UserService calendar busy times endpoint
/// </summary>
public record ExternalBusyTimesResponse
{
    public bool HasConnectedCalendars { get; init; }
    public List<string> ConnectedProviders { get; init; } = [];
    public List<BusyTimeSlot> BusySlots { get; init; } = [];
}

/// <summary>
/// Busy time slot from external calendar
/// </summary>
public record BusyTimeSlot
{
    public DateTime Start { get; init; }
    public DateTime End { get; init; }
    public string? Title { get; init; }
    public string Provider { get; init; } = string.Empty;
}

public class MutualAvailabilityService(
    IServiceCommunicationManager serviceCommunication,
    ILogger<MutualAvailabilityService> logger)
    : IMutualAvailabilityService
{
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;
    private readonly ILogger<MutualAvailabilityService> _logger = logger;

    // Working hours definition (can be made configurable)
    private static readonly TimeSpan WorkingHoursStart = TimeSpan.FromHours(9);  // 9 AM
    private static readonly TimeSpan WorkingHoursEnd = TimeSpan.FromHours(18);   // 6 PM

    public async Task<MutualAvailabilityResult> FindMutualAvailabilityAsync(
        string user1Id,
        string user2Id,
        DateTime startDate,
        DateTime endDate,
        int sessionDurationMinutes = 60,
        int maxSlots = 5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation(
                "Finding mutual availability for users {User1Id} and {User2Id} from {Start} to {End}",
                user1Id, user2Id, startDate, endDate);

            // Fetch busy times for both users in parallel
            var user1BusyTask = GetUserBusyTimesAsync(user1Id, startDate, endDate, cancellationToken);
            var user2BusyTask = GetUserBusyTimesAsync(user2Id, startDate, endDate, cancellationToken);

            await Task.WhenAll(user1BusyTask, user2BusyTask);

            var user1Busy = await user1BusyTask;
            var user2Busy = await user2BusyTask;

            // Merge all busy times
            var allBusySlots = new List<(DateTime Start, DateTime End)>();

            if (user1Busy != null)
            {
                allBusySlots.AddRange(user1Busy.BusySlots.Select(s => (s.Start, s.End)));
            }
            if (user2Busy != null)
            {
                allBusySlots.AddRange(user2Busy.BusySlots.Select(s => (s.Start, s.End)));
            }

            // Sort and merge overlapping busy slots
            var mergedBusySlots = MergeBusySlots(allBusySlots);

            // Find free slots within working hours
            var availableSlots = FindFreeSlots(
                startDate,
                endDate,
                mergedBusySlots,
                sessionDurationMinutes,
                maxSlots);

            _logger.LogInformation(
                "Found {Count} mutual free slots for users {User1Id} and {User2Id}",
                availableSlots.Count, user1Id, user2Id);

            return MutualAvailabilityResult.Succeeded(
                availableSlots,
                user1Busy?.HasConnectedCalendars ?? false,
                user2Busy?.HasConnectedCalendars ?? false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding mutual availability for users {User1Id} and {User2Id}",
                user1Id, user2Id);
            return MutualAvailabilityResult.Failed(ex.Message);
        }
    }

    private async Task<ExternalBusyTimesResponse?> GetUserBusyTimesAsync(
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var startTimeStr = startDate.ToString("o");
            var endTimeStr = endDate.ToString("o");

            var response = await _serviceCommunication.GetAsync<ExternalBusyTimesResponse>(
                "UserService",
                $"/api/users/calendar/{userId}/busy-times?startTime={startTimeStr}&endTime={endTimeStr}",
                cancellationToken);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get busy times for user {UserId}", userId);
            return null;
        }
    }

    private static List<(DateTime Start, DateTime End)> MergeBusySlots(
        List<(DateTime Start, DateTime End)> slots)
    {
        if (slots.Count == 0) return [];

        var sorted = slots.OrderBy(s => s.Start).ToList();
        var merged = new List<(DateTime Start, DateTime End)>();

        var current = sorted[0];
        for (var i = 1; i < sorted.Count; i++)
        {
            if (sorted[i].Start <= current.End)
            {
                // Overlapping or adjacent - merge
                current = (current.Start, sorted[i].End > current.End ? sorted[i].End : current.End);
            }
            else
            {
                merged.Add(current);
                current = sorted[i];
            }
        }
        merged.Add(current);

        return merged;
    }

    private static List<AvailableSlot> FindFreeSlots(
        DateTime startDate,
        DateTime endDate,
        List<(DateTime Start, DateTime End)> busySlots,
        int sessionDurationMinutes,
        int maxSlots)
    {
        var availableSlots = new List<AvailableSlot>();
        var sessionDuration = TimeSpan.FromMinutes(sessionDurationMinutes);

        // Start from tomorrow to give some buffer
        var currentDate = startDate.Date.AddDays(1);

        while (currentDate <= endDate && availableSlots.Count < maxSlots)
        {
            // Skip weekends
            if (currentDate.DayOfWeek == DayOfWeek.Saturday || currentDate.DayOfWeek == DayOfWeek.Sunday)
            {
                currentDate = currentDate.AddDays(1);
                continue;
            }

            // Check each hour slot within working hours
            var slotStart = currentDate.Add(WorkingHoursStart);
            var dayEnd = currentDate.Add(WorkingHoursEnd);

            while (slotStart.Add(sessionDuration) <= dayEnd && availableSlots.Count < maxSlots)
            {
                var slotEnd = slotStart.Add(sessionDuration);

                // Check if this slot overlaps with any busy slot
                var isAvailable = !busySlots.Any(busy =>
                    busy.Start < slotEnd && busy.End > slotStart);

                if (isAvailable)
                {
                    availableSlots.Add(new AvailableSlot
                    {
                        Start = slotStart,
                        End = slotEnd,
                        DayOfWeek = slotStart.ToString("dddd"),
                        FormattedDate = slotStart.ToString("MMMM dd, yyyy"),
                        FormattedTime = $"{slotStart:HH:mm} - {slotEnd:HH:mm} UTC"
                    });
                }

                // Move to next hour slot
                slotStart = slotStart.AddHours(1);
            }

            currentDate = currentDate.AddDays(1);
        }

        return availableSlots;
    }
}
