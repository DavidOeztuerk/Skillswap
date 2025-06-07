using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserLoggedOutDomainEvent(
    string UserId,
    string? Reason) : DomainEvent;
