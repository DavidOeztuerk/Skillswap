using AppointmentService.Application.Services;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.Services;

/// <summary>
/// Implementation of IAppointmentSchedulingAlgorithm for intelligent appointment scheduling
/// </summary>
public class AppointmentSchedulingAlgorithm : IAppointmentSchedulingAlgorithm
{
    private readonly IAvailabilityCheckService _availabilityService;
    private readonly IPreferredTimeParser _timeParser;
    private readonly ILogger<AppointmentSchedulingAlgorithm> _logger;

    public AppointmentSchedulingAlgorithm(
        IAvailabilityCheckService availabilityService,
        IPreferredTimeParser timeParser,
        ILogger<AppointmentSchedulingAlgorithm> logger)
    {
        _availabilityService = availabilityService;
        _timeParser = timeParser;
        _logger = logger;
    }

    public async Task<List<ProposedAppointment>> GenerateAppointmentSlotsAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Generating {Count} appointment slots for users {RequesterId} and {TargetUserId}",
            request.TotalSessions, request.RequesterId, request.TargetUserId);

        // Validate input
        if (request.TotalSessions <= 0)
        {
            _logger.LogWarning("Invalid session count: {Count}", request.TotalSessions);
            return new List<ProposedAppointment>();
        }

        // Find mutual availability
        var availableSlots = await _availabilityService.FindMutualAvailabilityAsync(
            request.RequesterId,
            request.TargetUserId,
            request.PreferredDays,
            request.PreferredTimes,
            request.TotalSessions,
            request.SessionDurationMinutes,
            cancellationToken);

        _logger.LogInformation("Found {Count} available slots", availableSlots.Count);

        if (availableSlots.Count == 0)
        {
            _logger.LogWarning("No available slots found for the given preferences");
            return new List<ProposedAppointment>();
        }

        // Distribute sessions if requested
        if (request.DistributeEvenly && availableSlots.Count > request.TotalSessions)
        {
            availableSlots = DistributeSlotsEvenly(
                availableSlots,
                request.TotalSessions,
                request.MinimumDaysBetweenSessions,
                request.MaximumDaysBetweenSessions);

            _logger.LogInformation("Distributed slots evenly, selected {Count} slots", availableSlots.Count);
        }

        // Take only the number of slots we need
        var selectedSlots = availableSlots.Take(request.TotalSessions).ToList();

        // Convert to ProposedAppointments
        var proposedAppointments = new List<ProposedAppointment>();

        for (int i = 0; i < selectedSlots.Count; i++)
        {
            var slot = selectedSlots[i];
            var sessionNumber = i + 1;

            // For skill exchange, alternate organizer/participant
            string organizerUserId, participantUserId;
            if (request.IsSkillExchange)
            {
                // Alternate who teaches: odd sessions = requester teaches, even = target teaches
                if (sessionNumber % 2 == 1)
                {
                    organizerUserId = request.RequesterId;
                    participantUserId = request.TargetUserId;
                }
                else
                {
                    organizerUserId = request.TargetUserId;
                    participantUserId = request.RequesterId;
                }
            }
            else
            {
                // Non-exchange: requester is always organizer
                organizerUserId = request.RequesterId;
                participantUserId = request.TargetUserId;
            }

            // Calculate confidence score based on how well it matches preferences
            var confidenceScore = CalculateConfidenceScore(
                slot.StartTime,
                request.PreferredDays,
                request.PreferredTimes);

            var proposed = new ProposedAppointment
            {
                ScheduledDate = slot.StartTime,
                DurationMinutes = slot.DurationMinutes,
                SessionNumber = sessionNumber,
                OrganizerUserId = organizerUserId,
                ParticipantUserId = participantUserId,
                ConflictLevel = slot.HasConflict ? ConflictLevel.Minor : ConflictLevel.None,
                Conflict = slot.Conflict,
                ConfidenceScore = confidenceScore,
                Notes = confidenceScore < 0.8 ? "Outside peak preferred hours" : null
            };

            proposedAppointments.Add(proposed);
        }

        _logger.LogInformation(
            "Successfully generated {Count} proposed appointments",
            proposedAppointments.Count);

        return proposedAppointments;
    }

    public async Task<SchedulingFeasibilityResult> ValidateFeasibilityAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Validating feasibility for {Count} sessions",
            request.TotalSessions);

        var warnings = new List<string>();
        var recommendations = new List<string>();

        // Validate preferences format
        var validationResult = _timeParser.Validate(request.PreferredDays, request.PreferredTimes);
        if (!validationResult.IsValid)
        {
            warnings.AddRange(validationResult.Errors);
        }

        // Check if there are any potential slots
        var availableSlots = await _availabilityService.FindMutualAvailabilityAsync(
            request.RequesterId,
            request.TargetUserId,
            request.PreferredDays,
            request.PreferredTimes,
            request.TotalSessions * 2, // Check for double to see if there's flexibility
            request.SessionDurationMinutes,
            cancellationToken);

        var availableCount = availableSlots.Count;
        var isFeasible = availableCount >= request.TotalSessions;

        // Generate warnings based on availability
        if (availableCount == 0)
        {
            warnings.Add("No available time slots found with current preferences");
            recommendations.Add("Try expanding preferred days or time ranges");
        }
        else if (availableCount < request.TotalSessions)
        {
            warnings.Add($"Only {availableCount} of {request.TotalSessions} requested slots are available");
            recommendations.Add($"Consider reducing session count to {availableCount} or expanding time preferences");
        }
        else if (availableCount < request.TotalSessions * 1.5)
        {
            warnings.Add("Limited scheduling flexibility - very few alternative slots available");
            recommendations.Add("Consider expanding time preferences for more flexibility");
        }

        // Check session spacing
        if (isFeasible && availableSlots.Count >= 2)
        {
            var averageGapDays = CalculateAverageGapDays(availableSlots);
            if (averageGapDays < request.MinimumDaysBetweenSessions)
            {
                warnings.Add($"Sessions may be scheduled closer than {request.MinimumDaysBetweenSessions} days apart");
            }
            else if (averageGapDays > request.MaximumDaysBetweenSessions)
            {
                warnings.Add($"Sessions may be scheduled further than {request.MaximumDaysBetweenSessions} days apart");
                recommendations.Add("Consider adding more preferred days to allow more frequent sessions");
            }
        }

        var result = new SchedulingFeasibilityResult
        {
            IsFeasible = isFeasible,
            AvailableSlots = availableCount,
            RequestedSlots = request.TotalSessions,
            Warnings = warnings,
            Recommendations = recommendations,
            Conflicts = new List<ConflictInfo>() // Could be enhanced to show specific conflicts
        };

        _logger.LogInformation(
            "Feasibility check complete: {IsFeasible}, {Available}/{Requested} slots available",
            result.IsFeasible, result.AvailableSlots, result.RequestedSlots);

        return result;
    }

    public async Task<List<AlternativeSchedulingOption>> GenerateAlternativesAsync(
        SchedulingRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating alternative scheduling options");

        var alternatives = new List<AlternativeSchedulingOption>();
        var originalDays = _timeParser.ParseDays(request.PreferredDays);
        var originalTimes = _timeParser.ParseTimeRanges(request.PreferredTimes);

        // Alternative 1: Add adjacent days
        if (originalDays.Count < 5) // Only if not already all weekdays
        {
            var expandedDays = ExpandDaysWithAdjacent(originalDays);
            if (expandedDays.Count > originalDays.Count)
            {
                var availableSlots = await _availabilityService.FindMutualAvailabilityAsync(
                    request.RequesterId,
                    request.TargetUserId,
                    expandedDays.Select(d => d.ToString()).ToArray(),
                    request.PreferredTimes,
                    request.TotalSessions,
                    request.SessionDurationMinutes,
                    cancellationToken);

                if (availableSlots.Count >= request.TotalSessions)
                {
                    alternatives.Add(new AlternativeSchedulingOption
                    {
                        Description = $"Add {string.Join(", ", expandedDays.Except(originalDays))} to available days",
                        AlternativeDays = expandedDays.Select(d => d.ToString()).ToArray(),
                        AlternativeTimes = request.PreferredTimes,
                        AvailableSlots = availableSlots.Count,
                        ConfidenceScore = 0.8,
                        DeviationScore = 0.2
                    });
                }
            }
        }

        // Alternative 2: Expand time ranges by 1 hour before/after
        var expandedTimes = ExpandTimeRanges(originalTimes, hoursToExpand: 1);
        if (expandedTimes.Count > 0)
        {
            var expandedTimeStrings = expandedTimes.Select(t => $"{t.Start:hh\\:mm}-{t.End:hh\\:mm}").ToArray();
            var availableSlots = await _availabilityService.FindMutualAvailabilityAsync(
                request.RequesterId,
                request.TargetUserId,
                request.PreferredDays,
                expandedTimeStrings,
                request.TotalSessions,
                request.SessionDurationMinutes,
                cancellationToken);

            if (availableSlots.Count >= request.TotalSessions)
            {
                alternatives.Add(new AlternativeSchedulingOption
                {
                    Description = "Expand time windows by 1 hour",
                    AlternativeDays = request.PreferredDays,
                    AlternativeTimes = expandedTimeStrings,
                    AvailableSlots = availableSlots.Count,
                    ConfidenceScore = 0.7,
                    DeviationScore = 0.3
                });
            }
        }

        // Alternative 3: Suggest weekends if not included
        if (!originalDays.Contains(DayOfWeek.Saturday) && !originalDays.Contains(DayOfWeek.Sunday))
        {
            var withWeekends = originalDays.Concat(new[] { DayOfWeek.Saturday, DayOfWeek.Sunday }).ToList();
            var availableSlots = await _availabilityService.FindMutualAvailabilityAsync(
                request.RequesterId,
                request.TargetUserId,
                withWeekends.Select(d => d.ToString()).ToArray(),
                request.PreferredTimes,
                request.TotalSessions,
                request.SessionDurationMinutes,
                cancellationToken);

            if (availableSlots.Count >= request.TotalSessions)
            {
                alternatives.Add(new AlternativeSchedulingOption
                {
                    Description = "Include weekends (Saturday, Sunday)",
                    AlternativeDays = withWeekends.Select(d => d.ToString()).ToArray(),
                    AlternativeTimes = request.PreferredTimes,
                    AvailableSlots = availableSlots.Count,
                    ConfidenceScore = 0.6,
                    DeviationScore = 0.4
                });
            }
        }

        _logger.LogInformation("Generated {Count} alternative options", alternatives.Count);
        return alternatives.OrderByDescending(a => a.ConfidenceScore).ToList();
    }

    /// <summary>
    /// Distributes slots evenly over time, respecting min/max gaps
    /// </summary>
    private List<TimeSlot> DistributeSlotsEvenly(
        List<TimeSlot> availableSlots,
        int sessionsNeeded,
        int minDaysBetween,
        int maxDaysBetween)
    {
        if (availableSlots.Count <= sessionsNeeded)
        {
            return availableSlots;
        }

        var distributed = new List<TimeSlot> { availableSlots[0] }; // Start with first slot
        var lastSelectedDate = availableSlots[0].StartTime;

        foreach (var slot in availableSlots.Skip(1))
        {
            var daysSinceLastSession = (slot.StartTime - lastSelectedDate).TotalDays;

            // If we've met minimum days and this slot helps maintain even distribution, take it
            if (daysSinceLastSession >= minDaysBetween)
            {
                distributed.Add(slot);
                lastSelectedDate = slot.StartTime;

                if (distributed.Count >= sessionsNeeded)
                {
                    break;
                }
            }
        }

        return distributed;
    }

    /// <summary>
    /// Calculates confidence score based on how well slot matches preferences
    /// </summary>
    private double CalculateConfidenceScore(
        DateTime slotTime,
        string[] preferredDays,
        string[] preferredTimes)
    {
        var score = 1.0;

        // Check day match
        var parsedDays = _timeParser.ParseDays(preferredDays);
        if (!parsedDays.Contains(slotTime.DayOfWeek))
        {
            score -= 0.3; // Penalty for non-preferred day
        }

        // Check time match
        var parsedTimes = _timeParser.ParseTimeRanges(preferredTimes);
        var slotTimeOfDay = slotTime.TimeOfDay;
        var matchesTimeRange = parsedTimes.Any(range => range.Contains(slotTimeOfDay));

        if (!matchesTimeRange)
        {
            score -= 0.3; // Penalty for non-preferred time
        }

        return Math.Max(0.0, score);
    }

    /// <summary>
    /// Calculates average gap in days between slots
    /// </summary>
    private double CalculateAverageGapDays(List<TimeSlot> slots)
    {
        if (slots.Count < 2)
        {
            return 0;
        }

        var totalGapDays = 0.0;
        for (int i = 1; i < slots.Count; i++)
        {
            totalGapDays += (slots[i].StartTime - slots[i - 1].StartTime).TotalDays;
        }

        return totalGapDays / (slots.Count - 1);
    }

    /// <summary>
    /// Expands days list with adjacent days
    /// </summary>
    private List<DayOfWeek> ExpandDaysWithAdjacent(List<DayOfWeek> originalDays)
    {
        var expanded = new HashSet<DayOfWeek>(originalDays);

        foreach (var day in originalDays.ToList())
        {
            // Add day before
            var dayBefore = day == DayOfWeek.Sunday ? DayOfWeek.Saturday : day - 1;
            expanded.Add(dayBefore);

            // Add day after
            var dayAfter = day == DayOfWeek.Saturday ? DayOfWeek.Sunday : day + 1;
            expanded.Add(dayAfter);
        }

        // Exclude weekends if not already in original
        if (!originalDays.Contains(DayOfWeek.Saturday))
        {
            expanded.Remove(DayOfWeek.Saturday);
        }
        if (!originalDays.Contains(DayOfWeek.Sunday))
        {
            expanded.Remove(DayOfWeek.Sunday);
        }

        return expanded.OrderBy(d => d).ToList();
    }

    /// <summary>
    /// Expands time ranges by specified hours
    /// </summary>
    private List<TimeRange> ExpandTimeRanges(List<TimeRange> originalRanges, int hoursToExpand)
    {
        var expanded = new List<TimeRange>();

        foreach (var range in originalRanges)
        {
            var newStart = range.Start.Subtract(TimeSpan.FromHours(hoursToExpand));
            var newEnd = range.End.Add(TimeSpan.FromHours(hoursToExpand));

            // Clamp to reasonable hours (6 AM - 11 PM)
            if (newStart < TimeSpan.FromHours(6))
            {
                newStart = TimeSpan.FromHours(6);
            }
            if (newEnd > TimeSpan.FromHours(23))
            {
                newEnd = TimeSpan.FromHours(23);
            }

            expanded.Add(new TimeRange(newStart, newEnd));
        }

        return expanded;
    }
}
