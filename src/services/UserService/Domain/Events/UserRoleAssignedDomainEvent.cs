using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserRoleAssignedDomainEvent(
    string UserId,
    string Email,
    string Role,
    string AssignedBy) : DomainEvent;
