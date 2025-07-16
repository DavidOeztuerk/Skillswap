using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserAvailabilityUpdatedDomainEvent(
    string UserId,
    string Email,
    List<WeeklyAvailabilityDto> WeeklySchedule,
    string? TimeZone) : DomainEvent;

public record WeeklyAvailabilityDto(
    string DayOfWeek,
    string StartTime,
    string EndTime,
    bool IsAvailable);
