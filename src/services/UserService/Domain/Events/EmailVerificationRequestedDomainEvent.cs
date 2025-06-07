using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record EmailVerificationRequestedDomainEvent(
    string UserId,
    string Email,
    string VerificationToken,
    string FirstName) : DomainEvent;
