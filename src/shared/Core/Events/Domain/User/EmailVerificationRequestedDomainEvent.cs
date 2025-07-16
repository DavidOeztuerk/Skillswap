using CQRS.Interfaces;

namespace Events.Domain.User;

public record EmailVerificationRequestedDomainEvent(
    string UserId,
    string Email,
    string VerificationToken,
    string FirstName) : DomainEvent;
