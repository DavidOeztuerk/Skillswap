using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record TwoFactorDisabledDomainEvent(
    string UserId,
    string Email) : DomainEvent;
