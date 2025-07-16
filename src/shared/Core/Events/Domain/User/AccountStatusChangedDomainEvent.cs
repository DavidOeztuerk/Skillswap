using CQRS.Interfaces;

namespace Events.Domain.User;

public record AccountStatusChangedDomainEvent(
    string UserId,
    string Email,
    string OldStatus,
    string NewStatus,
    string? Reason,
    string? ChangedBy) : DomainEvent;
