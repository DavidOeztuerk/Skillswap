using AppointmentService.Application.Services;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.Services;

/// <summary>
/// Implementation of IAvailabilityCheckService for checking user availability
/// </summary>
public class AvailabilityCheckService : IAvailabilityCheckService
{
    private readonly AppointmentDbContext _dbContext;
    private readonly IPreferredTimeParser _timeParser;
    private readonly ILogger<AvailabilityCheckService> _logger;

    public AvailabilityCheckService(
        AppointmentDbContext dbContext,
        IPreferredTimeParser timeParser,
        ILogger<AvailabilityCheckService> logger)
    {
        _dbContext = dbContext;
        _timeParser = timeParser;
        _logger = logger;
    }

    public async Task<bool> IsUserAvailableAsync(
        string userId,
        DateTime startTime,
        int durationMinutes,
        CancellationToken cancellationToken = default)
    {
        var conflict = await CheckForConflictAsync(userId, startTime, durationMinutes, null, cancellationToken);
        return conflict == null;
    }

    public async Task<List<ConflictInfo>> GetConflictsAsync(
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug(
            "Getting conflicts for user {UserId} from {StartDate} to {EndDate}",
            userId, startDate, endDate);

        // Query all appointments for the user in the date range
        var appointments = await _dbContext.SessionAppointments
            .Where(a =>
                (a.OrganizerUserId == userId || a.ParticipantUserId == userId) &&
                a.ScheduledDate >= startDate &&
                a.ScheduledDate <= endDate &&
                // Exclude cancelled and no-show appointments
                a.Status != SessionAppointmentStatus.Cancelled &&
                a.Status != SessionAppointmentStatus.NoShow)
            .OrderBy(a => a.ScheduledDate)
            .ToListAsync(cancellationToken);

        var conflicts = appointments.Select(apt => new ConflictInfo
        {
            AppointmentId = apt.Id,
            Title = apt.Title,
            StartTime = apt.ScheduledDate,
            EndTime = apt.ScheduledDate.AddMinutes(apt.DurationMinutes),
            DurationMinutes = apt.DurationMinutes,
            Status = apt.Status.ToString(),
            IsConfirmed = apt.IsConfirmed || apt.IsPaymentComplete,
            OtherPartyUserId = apt.OrganizerUserId == userId ? apt.ParticipantUserId : apt.OrganizerUserId,
            Severity = DetermineConflictSeverity(apt.Status)
        }).ToList();

        _logger.LogInformation(
            "Found {Count} conflicts for user {UserId} in date range",
            conflicts.Count, userId);

        return conflicts;
    }

    public async Task<List<TimeSlot>> FindMutualAvailabilityAsync(
        string user1Id,
        string user2Id,
        string[] preferredDays,
        string[] preferredTimes,
        int sessionsNeeded,
        int sessionDurationMinutes,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Finding mutual availability for users {User1Id} and {User2Id}, {SessionsNeeded} sessions needed",
            user1Id, user2Id, sessionsNeeded);

        // 1. Parse preferred days and times
        var days = _timeParser.ParseDays(preferredDays);
        var timeRanges = _timeParser.ParseTimeRanges(preferredTimes);

        // 2. Generate potential slots (next 4-8 weeks to ensure enough slots)
        var minimumBufferHours = 2;
        var earliestStartDate = DateTime.UtcNow.AddHours(minimumBufferHours);

        var weeksToCheck = Math.Max(4, (sessionsNeeded / days.Count) + 2);
        var potentialSlots = _timeParser.GeneratePotentialSlots(
            days,
            timeRanges,
            sessionDurationMinutes,
            earliestStartDate,
            weeksToCheck);

        _logger.LogDebug("Generated {Count} potential slots to check", potentialSlots.Count);

        if (potentialSlots.Count == 0)
        {
            _logger.LogWarning("No potential slots generated for the given preferences");
            return new List<TimeSlot>();
        }

        // 3. Get existing appointments for both users
        var minDate = potentialSlots.Min();
        var maxDate = potentialSlots.Max().AddMinutes(sessionDurationMinutes);

        var user1Appointments = await GetUserAppointmentsInRangeAsync(
            user1Id, minDate, maxDate, cancellationToken);

        var user2Appointments = await GetUserAppointmentsInRangeAsync(
            user2Id, minDate, maxDate, cancellationToken);

        _logger.LogDebug(
            "User1 has {Count1} appointments, User2 has {Count2} appointments in range",
            user1Appointments.Count, user2Appointments.Count);

        // 4. Filter out slots where either user has a conflict
        var availableSlots = new List<TimeSlot>();

        foreach (var slotStart in potentialSlots)
        {
            var slotEnd = slotStart.AddMinutes(sessionDurationMinutes);

            // Check User1 availability
            var user1Conflict = user1Appointments.FirstOrDefault(apt =>
                apt.ScheduledDate < slotEnd &&
                apt.ScheduledDate.AddMinutes(apt.DurationMinutes) > slotStart);

            // Check User2 availability
            var user2Conflict = user2Appointments.FirstOrDefault(apt =>
                apt.ScheduledDate < slotEnd &&
                apt.ScheduledDate.AddMinutes(apt.DurationMinutes) > slotStart);

            // If no conflicts for either user, add to available slots
            if (user1Conflict == null && user2Conflict == null)
            {
                availableSlots.Add(new TimeSlot(slotStart, sessionDurationMinutes));

                // Stop if we have enough slots
                if (availableSlots.Count >= sessionsNeeded)
                {
                    _logger.LogInformation(
                        "Found {Count} available slots (target: {Target}), stopping search",
                        availableSlots.Count, sessionsNeeded);
                    break;
                }
            }
        }

        if (availableSlots.Count < sessionsNeeded)
        {
            _logger.LogWarning(
                "Only found {Found} available slots out of {Needed} requested",
                availableSlots.Count, sessionsNeeded);
        }
        else
        {
            _logger.LogInformation(
                "Successfully found {Count} available slots for mutual scheduling",
                availableSlots.Count);
        }

        return availableSlots;
    }

    public async Task<ConflictInfo?> CheckForConflictAsync(
        string userId,
        DateTime proposedStart,
        int proposedDuration,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var proposedEnd = proposedStart.AddMinutes(proposedDuration);

        _logger.LogDebug(
            "Checking for conflicts for user {UserId} at {StartTime} for {Duration} minutes",
            userId, proposedStart, proposedDuration);

        // Query for overlapping appointments
        var query = _dbContext.SessionAppointments
            .Where(a =>
                (a.OrganizerUserId == userId || a.ParticipantUserId == userId) &&
                a.Status != SessionAppointmentStatus.Cancelled &&
                a.Status != SessionAppointmentStatus.NoShow &&
                // Check for time overlap
                a.ScheduledDate < proposedEnd);

        // Apply the overlap condition using EF Core compatible expression
        var appointments = await query.ToListAsync(cancellationToken);

        // Filter in memory for the end time check and exclusion
        var conflictingAppointment = appointments
            .Where(a =>
                a.ScheduledDate.AddMinutes(a.DurationMinutes) > proposedStart &&
                (excludeAppointmentId == null || a.Id != excludeAppointmentId))
            .OrderBy(a => a.ScheduledDate)
            .FirstOrDefault();

        if (conflictingAppointment == null)
        {
            _logger.LogDebug("No conflicts found for the proposed time slot");
            return null;
        }

        _logger.LogInformation(
            "Found conflict with appointment {AppointmentId} ({Title}) at {StartTime}",
            conflictingAppointment.Id, conflictingAppointment.Title, conflictingAppointment.ScheduledDate);

        return new ConflictInfo
        {
            AppointmentId = conflictingAppointment.Id,
            Title = conflictingAppointment.Title,
            StartTime = conflictingAppointment.ScheduledDate,
            EndTime = conflictingAppointment.ScheduledDate.AddMinutes(conflictingAppointment.DurationMinutes),
            DurationMinutes = conflictingAppointment.DurationMinutes,
            Status = conflictingAppointment.Status.ToString(),
            IsConfirmed = conflictingAppointment.IsConfirmed || conflictingAppointment.IsPaymentComplete,
            OtherPartyUserId = conflictingAppointment.OrganizerUserId == userId
                ? conflictingAppointment.ParticipantUserId
                : conflictingAppointment.OrganizerUserId,
            Severity = DetermineConflictSeverity(conflictingAppointment.Status)
        };
    }

    /// <summary>
    /// Gets all appointments for a user in a specific date range
    /// </summary>
    private async Task<List<SessionAppointment>> GetUserAppointmentsInRangeAsync(
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken)
    {
        return await _dbContext.SessionAppointments
            .Where(a =>
                (a.OrganizerUserId == userId || a.ParticipantUserId == userId) &&
                a.ScheduledDate >= startDate &&
                a.ScheduledDate <= endDate &&
                a.Status != SessionAppointmentStatus.Cancelled &&
                a.Status != SessionAppointmentStatus.NoShow)
            .OrderBy(a => a.ScheduledDate)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Determines the severity of a conflict based on appointment status
    /// </summary>
    private static ConflictSeverity DetermineConflictSeverity(SessionAppointmentStatus appointmentStatus)
    {
        return appointmentStatus switch
        {
            SessionAppointmentStatus.Pending => ConflictSeverity.Minor,
            SessionAppointmentStatus.RescheduleRequested => ConflictSeverity.Minor,
            SessionAppointmentStatus.Confirmed => ConflictSeverity.Moderate,
            SessionAppointmentStatus.WaitingForPayment => ConflictSeverity.Moderate,
            SessionAppointmentStatus.PaymentCompleted => ConflictSeverity.Major,
            SessionAppointmentStatus.InProgress => ConflictSeverity.Major,
            SessionAppointmentStatus.Completed => ConflictSeverity.None, // Past appointments don't conflict
            _ => ConflictSeverity.None
        };
    }
}
