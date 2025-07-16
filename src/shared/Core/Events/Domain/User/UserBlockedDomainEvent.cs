using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserBlockedDomainEvent(
    string UserId,
    string BlockedUserId,
    string? Reason) : DomainEvent;
