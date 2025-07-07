using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record AvatarDeletedDomainEvent(
    string UserId,
    string Email,
    string OldAvatarUrl) : DomainEvent;
