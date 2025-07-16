using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserUnblockedDomainEvent(
    string UserId,
    string UnblockedUserId) : DomainEvent;
