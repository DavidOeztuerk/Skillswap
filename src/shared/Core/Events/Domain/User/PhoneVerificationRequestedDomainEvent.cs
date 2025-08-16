using CQRS.Interfaces;

namespace Events.Domain.User;

public record PhoneVerificationRequestedDomainEvent(
    string UserId,
    string Email,
    string PhoneNumber,
    string VerificationCode,
    string FirstName) : DomainEvent;