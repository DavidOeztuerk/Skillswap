using CQRS.Interfaces;

namespace Events.Domain.User;

public record AvatarDeletedDomainEvent(
    string UserId,
    string Email,
    string OldAvatarUrl) : DomainEvent;
