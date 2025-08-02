using CQRS.Interfaces;

namespace Events.Integration.UserManagement;

public record UserDeletedEvent(
    string UserId,
    string Email,
    string DeletedBy,
    string Reason) : DomainEvent;
