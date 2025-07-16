using CQRS.Interfaces;

namespace Events.Domain.User;

public record EmailVerifiedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
