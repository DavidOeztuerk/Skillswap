using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.Services;

/// <summary>
/// Service to find available time slots for scheduling sessions
/// Complex logic prepared for future integration with email provider calendars (Google/Outlook)
/// </summary>
public class AvailableSlotFinderService : IAvailableSlotFinderService
{
    private readonly IAppointmentUnitOfWork _unitOfWork;
    private readonly ILogger<AvailableSlotFinderService> _logger;

    // Configuration constants
    private const int MaxWeeksToSearch = 12; // Search up to 3 months ahead
    private const int MinBufferMinutes = 15; // Minimum buffer between appointments
    private const int BusinessDayStartHour = 8; // 8 AM
    private const int BusinessDayEndHour = 20; // 8 PM

    public AvailableSlotFinderService(
        IAppointmentUnitOfWork unitOfWork,
        ILogger<AvailableSlotFinderService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<List<DateTime>> FindAvailableSlotsAsync(
        string userId1,
        string userId2,
        List<int> preferredDaysOfWeek,
        List<string> preferredTimeSlots,
        int sessionDurationMinutes,
        int numberOfSlots,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Finding {Count} available slots for users {User1} and {User2}. Days: {Days}, TimeSlots: {TimeSlots}, Duration: {Duration}min",
            numberOfSlots, userId1, userId2, string.Join(",", preferredDaysOfWeek), string.Join(",", preferredTimeSlots), sessionDurationMinutes);

        // Load existing appointments for both users (upcoming only)
        var user1Appointments = await LoadUpcomingAppointmentsAsync(userId1, cancellationToken);
        var user2Appointments = await LoadUpcomingAppointmentsAsync(userId2, cancellationToken);

        _logger.LogInformation(
            "Loaded {Count1} appointments for user1, {Count2} appointments for user2",
            user1Appointments.Count, user2Appointments.Count);

        var availableSlots = new List<DateTime>();
        var currentDate = DateTime.UtcNow.Date.AddDays(1); // Start searching from tomorrow
        var endDate = currentDate.AddDays(MaxWeeksToSearch * 7);

        // Parse preferred time slots
        var timeRanges = ParseTimeSlots(preferredTimeSlots);

        _logger.LogInformation("Parsed {Count} time ranges from preferred slots", timeRanges.Count);

        // Iterate through dates until we find enough slots
        while (availableSlots.Count < numberOfSlots && currentDate <= endDate)
        {
            // Check if this day of week is preferred
            var dayOfWeek = (int)currentDate.DayOfWeek;
            if (preferredDaysOfWeek.Contains(dayOfWeek))
            {
                _logger.LogDebug("Checking {Date} ({DayOfWeek})", currentDate, currentDate.DayOfWeek);

                // Check each time range
                foreach (var timeRange in timeRanges)
                {
                    if (availableSlots.Count >= numberOfSlots)
                        break;

                    // Generate candidate slots within this time range
                    var candidateSlots = GenerateCandidateSlotsForTimeRange(
                        currentDate,
                        timeRange.StartHour,
                        timeRange.StartMinute,
                        timeRange.EndHour,
                        timeRange.EndMinute,
                        sessionDurationMinutes);

                    // Check each candidate slot for availability
                    foreach (var candidateSlot in candidateSlots)
                    {
                        if (availableSlots.Count >= numberOfSlots)
                            break;

                        // Check if slot is available for both users
                        var isAvailable = await IsSlotAvailableInternalAsync(
                            candidateSlot,
                            sessionDurationMinutes,
                            user1Appointments,
                            user2Appointments,
                            cancellationToken);

                        if (isAvailable)
                        {
                            availableSlots.Add(candidateSlot);
                            _logger.LogDebug("Found available slot: {Slot}", candidateSlot);
                        }
                    }
                }
            }

            currentDate = currentDate.AddDays(1);
        }

        _logger.LogInformation("Found {Count} available slots out of {Requested} requested", availableSlots.Count, numberOfSlots);

        return availableSlots.Take(numberOfSlots).ToList();
    }

    public async Task<bool> IsSlotAvailableAsync(
        string userId1,
        string userId2,
        DateTime proposedDateTime,
        int durationMinutes,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Checking if slot {DateTime} ({Duration}min) is available for users {User1} and {User2}",
            proposedDateTime, durationMinutes, userId1, userId2);

        // Load existing appointments for both users
        var user1Appointments = await LoadUpcomingAppointmentsAsync(userId1, cancellationToken);
        var user2Appointments = await LoadUpcomingAppointmentsAsync(userId2, cancellationToken);

        var isAvailable = await IsSlotAvailableInternalAsync(
            proposedDateTime,
            durationMinutes,
            user1Appointments,
            user2Appointments,
            cancellationToken);

        _logger.LogInformation("Slot availability: {IsAvailable}", isAvailable);

        return isAvailable;
    }

    #region Private Helper Methods

    private async Task<List<SessionAppointment>> LoadUpcomingAppointmentsAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var appointments = await _unitOfWork.SessionAppointments.GetUserAppointmentsAsync(userId, cancellationToken);

        // Filter to upcoming appointments only (not cancelled)
        return appointments
            .Where(a => a.ScheduledDate >= DateTime.UtcNow &&
                       a.Status != SessionAppointmentStatus.Cancelled &&
                       a.Status != SessionAppointmentStatus.Completed)
            .ToList();
    }

    private Task<bool> IsSlotAvailableInternalAsync(
        DateTime proposedDateTime,
        int durationMinutes,
        List<SessionAppointment> user1Appointments,
        List<SessionAppointment> user2Appointments,
        CancellationToken cancellationToken)
    {
        var proposedEndTime = proposedDateTime.AddMinutes(durationMinutes);

        // Check for conflicts with user1's appointments
        var hasUser1Conflict = user1Appointments.Any(a =>
            DoTimeRangesOverlap(
                proposedDateTime,
                proposedEndTime,
                a.ScheduledDate,
                a.ScheduledDate.AddMinutes(a.DurationMinutes + MinBufferMinutes)));

        if (hasUser1Conflict)
        {
            _logger.LogDebug("Conflict detected with user1's existing appointment");
            return Task.FromResult(false);
        }

        // Check for conflicts with user2's appointments
        var hasUser2Conflict = user2Appointments.Any(a =>
            DoTimeRangesOverlap(
                proposedDateTime,
                proposedEndTime,
                a.ScheduledDate,
                a.ScheduledDate.AddMinutes(a.DurationMinutes + MinBufferMinutes)));

        if (hasUser2Conflict)
        {
            _logger.LogDebug("Conflict detected with user2's existing appointment");
            return Task.FromResult(false);
        }

        // TODO: Future enhancement - Check email provider calendars (Google/Outlook)
        // var hasExternalConflict = await CheckExternalCalendarsAsync(userId1, userId2, proposedDateTime, durationMinutes);

        return Task.FromResult(true);
    }

    private bool DoTimeRangesOverlap(
        DateTime start1,
        DateTime end1,
        DateTime start2,
        DateTime end2)
    {
        // Two time ranges overlap if:
        // - Range1 starts before Range2 ends AND
        // - Range1 ends after Range2 starts
        return start1 < end2 && end1 > start2;
    }

    private List<TimeRange> ParseTimeSlots(List<string> preferredTimeSlots)
    {
        var timeRanges = new List<TimeRange>();

        foreach (var slot in preferredTimeSlots)
        {
            try
            {
                // Expected format: "09:00-12:00" or "14:00-18:00"
                var parts = slot.Split('-');
                if (parts.Length != 2)
                {
                    _logger.LogWarning("Invalid time slot format: {Slot}", slot);
                    continue;
                }

                var startParts = parts[0].Trim().Split(':');
                var endParts = parts[1].Trim().Split(':');

                if (startParts.Length != 2 || endParts.Length != 2)
                {
                    _logger.LogWarning("Invalid time format in slot: {Slot}", slot);
                    continue;
                }

                timeRanges.Add(new TimeRange
                {
                    StartHour = int.Parse(startParts[0]),
                    StartMinute = int.Parse(startParts[1]),
                    EndHour = int.Parse(endParts[0]),
                    EndMinute = int.Parse(endParts[1])
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing time slot: {Slot}", slot);
            }
        }

        // Sort time ranges chronologically to ensure earliest times are checked first
        timeRanges = timeRanges
            .OrderBy(t => t.StartHour)
            .ThenBy(t => t.StartMinute)
            .ToList();

        // If no valid time slots provided, use default business hours
        if (timeRanges.Count == 0)
        {
            _logger.LogInformation("No valid time slots provided, using default business hours");
            timeRanges.Add(new TimeRange
            {
                StartHour = BusinessDayStartHour,
                StartMinute = 0,
                EndHour = BusinessDayEndHour,
                EndMinute = 0
            });
        }

        return timeRanges;
    }

    private List<DateTime> GenerateCandidateSlotsForTimeRange(
        DateTime date,
        int startHour,
        int startMinute,
        int endHour,
        int endMinute,
        int sessionDurationMinutes)
    {
        var slots = new List<DateTime>();

        var currentSlot = new DateTime(date.Year, date.Month, date.Day, startHour, startMinute, 0, DateTimeKind.Utc);
        var endTime = new DateTime(date.Year, date.Month, date.Day, endHour, endMinute, 0, DateTimeKind.Utc);

        // Generate slots every hour (or session duration, whichever is smaller)
        var slotIncrement = Math.Min(60, sessionDurationMinutes);

        while (currentSlot.AddMinutes(sessionDurationMinutes) <= endTime)
        {
            // Only suggest slots in the future
            if (currentSlot > DateTime.UtcNow)
            {
                slots.Add(currentSlot);
            }

            currentSlot = currentSlot.AddMinutes(slotIncrement);
        }

        return slots;
    }

    #endregion

    #region Helper Classes

    private class TimeRange
    {
        public int StartHour { get; set; }
        public int StartMinute { get; set; }
        public int EndHour { get; set; }
        public int EndMinute { get; set; }
    }

    #endregion
}
