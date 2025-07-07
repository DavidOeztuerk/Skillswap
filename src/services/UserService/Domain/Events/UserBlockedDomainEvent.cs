using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserBlockedDomainEvent(
    string UserId,
    string BlockedUserId,
    string? Reason) : DomainEvent;
