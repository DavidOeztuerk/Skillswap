using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record EmailVerifiedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
