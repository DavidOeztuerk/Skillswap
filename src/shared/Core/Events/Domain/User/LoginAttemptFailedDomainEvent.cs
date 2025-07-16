using CQRS.Interfaces;

namespace Events.Domain.User;

public record LoginAttemptFailedDomainEvent(
    string Email,
    string IpAddress,
    string Reason) : DomainEvent;
