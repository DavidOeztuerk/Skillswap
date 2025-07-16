using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserRoleRevokedDomainEvent(
    string UserId,
    string Email,
    string Role,
    string RevokedBy) : DomainEvent;
