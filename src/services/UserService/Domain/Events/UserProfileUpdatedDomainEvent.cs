using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserProfileUpdatedDomainEvent(
    string UserId,
    string Email,
    Dictionary<string, string> ChangedFields) : DomainEvent;
