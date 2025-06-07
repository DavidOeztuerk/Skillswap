using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserRoleRevokedDomainEvent(
    string UserId,
    string Email,
    string Role,
    string RevokedBy) : DomainEvent;
