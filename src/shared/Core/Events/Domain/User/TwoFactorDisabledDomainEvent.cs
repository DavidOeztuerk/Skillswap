using CQRS.Interfaces;

namespace Events.Domain.User;

public record TwoFactorDisabledDomainEvent(
    string UserId,
    string Email) : DomainEvent;
