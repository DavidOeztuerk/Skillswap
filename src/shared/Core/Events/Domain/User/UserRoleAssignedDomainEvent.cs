using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserRoleAssignedDomainEvent(
    string UserId,
    string Email,
    string Role,
    string AssignedBy) : DomainEvent;
