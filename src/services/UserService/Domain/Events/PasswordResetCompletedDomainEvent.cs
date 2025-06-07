using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record PasswordResetCompletedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
