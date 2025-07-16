using CQRS.Interfaces;

namespace Events.Domain.User;

public record MultipleFailedLoginAttemptsDomainEvent(
    string Email,
    string IpAddress,
    int AttemptCount,
    DateTime WindowStart,
    DateTime WindowEnd) : DomainEvent;
