using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserBlockedEvent(
     string UserId,
     string BlockedUserId,
     string? Reason,
     DateTime Timestamp) : DomainEvent;
