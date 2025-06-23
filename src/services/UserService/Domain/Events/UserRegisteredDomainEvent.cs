using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserRegisteredDomainEvent(
    string UserId,
    string Email,
    string FirstName,
    string LastName
) : DomainEvent;
