using CQRS.Interfaces;

namespace Events.Domain.User;

public record SuspiciousActivityDetectedDomainEvent(
    string UserId,
    string Email,
    string ActivityType,
    string IpAddress,
    string? UserAgent,
    Dictionary<string, object> Details) : DomainEvent;
