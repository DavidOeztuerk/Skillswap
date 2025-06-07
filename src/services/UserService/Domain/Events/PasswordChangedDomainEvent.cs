using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record PasswordChangedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
