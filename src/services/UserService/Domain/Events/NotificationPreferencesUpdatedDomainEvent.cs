using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record NotificationPreferencesUpdatedDomainEvent(
    string UserId,
    string Email,
    object NotificationPreferences) : DomainEvent;
