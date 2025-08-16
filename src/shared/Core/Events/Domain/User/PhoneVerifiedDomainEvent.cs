using CQRS.Interfaces;

namespace Events.Domain.User;

public record PhoneVerifiedDomainEvent(
    string UserId,
    string Email,
    string PhoneNumber,
    string FirstName) : DomainEvent;