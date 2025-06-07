using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record PasswordResetRequestedDomainEvent(
    string UserId,
    string Email,
    string ResetToken,
    string FirstName) : DomainEvent;
