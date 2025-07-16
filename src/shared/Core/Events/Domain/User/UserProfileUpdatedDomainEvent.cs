using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserProfileUpdatedDomainEvent(
    string UserId,
    string Email,
    Dictionary<string, string> ChangedFields) : DomainEvent;
