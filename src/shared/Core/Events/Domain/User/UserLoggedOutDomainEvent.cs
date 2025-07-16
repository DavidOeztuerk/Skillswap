using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserLoggedOutDomainEvent(
    string UserId,
    string? Reason) : DomainEvent;
