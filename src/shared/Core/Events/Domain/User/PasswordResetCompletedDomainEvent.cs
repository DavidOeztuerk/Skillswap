using CQRS.Interfaces;

namespace Events.Domain.User;

public record PasswordResetCompletedDomainEvent(
    string UserId,
    string Email) : DomainEvent;
