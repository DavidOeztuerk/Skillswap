using CQRS.Interfaces;

namespace Events.Domain.User;

public record AccountSuspendedDomainEvent(
    string UserId,
    string Email,
    string Reason,
    DateTime? SuspendedUntil,
    string SuspendedBy) : DomainEvent;
