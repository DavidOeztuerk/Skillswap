using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserRegisteredDomainEvent(
    string UserId,
    string Email,
    string FirstName,
    string LastName
) : DomainEvent;
