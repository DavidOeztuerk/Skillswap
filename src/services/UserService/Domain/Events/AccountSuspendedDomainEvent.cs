using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record AccountSuspendedDomainEvent(
    string UserId,
    string Email,
    string Reason,
    DateTime? SuspendedUntil,
    string SuspendedBy) : DomainEvent;
