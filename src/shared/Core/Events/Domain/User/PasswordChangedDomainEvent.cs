using CQRS.Interfaces;

namespace Events.Domain.User;

public record PasswordChangedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
