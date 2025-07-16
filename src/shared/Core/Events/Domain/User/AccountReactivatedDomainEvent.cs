using CQRS.Interfaces;

namespace Events.Domain.User;

public record AccountReactivatedDomainEvent(
    string UserId,
    string Email,
    string ReactivatedBy) : DomainEvent;
