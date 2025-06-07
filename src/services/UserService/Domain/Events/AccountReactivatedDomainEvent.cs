using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record AccountReactivatedDomainEvent(
    string UserId,
    string Email,
    string ReactivatedBy) : DomainEvent;
