namespace UserService.Application.Commands;

public record WeeklyAvailability(
    DayOfWeek DayOfWeek,
    List<TimeSlot> TimeSlots);

public record TimeSlot(
    TimeOnly StartTime,
    TimeOnly EndTime);

public record DateRange(
    DateTime StartDate,
    DateTime EndDate,
    string? Reason = null);
