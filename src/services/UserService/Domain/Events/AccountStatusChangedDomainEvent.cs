using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record AccountStatusChangedDomainEvent(
    string UserId,
    string Email,
    string OldStatus,
    string NewStatus,
    string? Reason,
    string? ChangedBy) : DomainEvent;
