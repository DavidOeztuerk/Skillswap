using CQRS.Interfaces;

namespace Events.Domain.User;

public record PasswordResetRequestedDomainEvent(
    string UserId,
    string Email,
    string ResetToken,
    string FirstName) : DomainEvent;
