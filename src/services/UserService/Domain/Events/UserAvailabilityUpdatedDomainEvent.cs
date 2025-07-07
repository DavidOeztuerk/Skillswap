using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Domain.Events;

public record UserAvailabilityUpdatedDomainEvent(
    string UserId,
    string Email,
    List<WeeklyAvailability> WeeklySchedule,
    string? TimeZone) : DomainEvent;
