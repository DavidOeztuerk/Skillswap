using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserUnblockedDomainEvent(
    string UserId,
    string UnblockedUserId) : DomainEvent;
