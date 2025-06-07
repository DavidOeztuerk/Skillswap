using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record SuspiciousActivityDetectedDomainEvent(
    string UserId,
    string Email,
    string ActivityType,
    string IpAddress,
    string? UserAgent,
    Dictionary<string, object> Details) : DomainEvent;
