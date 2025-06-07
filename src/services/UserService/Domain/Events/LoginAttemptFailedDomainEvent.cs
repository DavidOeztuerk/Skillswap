using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record LoginAttemptFailedDomainEvent(
    string Email,
    string IpAddress,
    string Reason) : DomainEvent;
