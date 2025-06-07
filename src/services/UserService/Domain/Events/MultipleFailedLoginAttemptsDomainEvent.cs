using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record MultipleFailedLoginAttemptsDomainEvent(
    string Email,
    string IpAddress,
    int AttemptCount,
    DateTime WindowStart,
    DateTime WindowEnd) : DomainEvent;
