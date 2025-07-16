using CQRS.Interfaces;

namespace Events.Domain.User;

public record NotificationPreferencesUpdatedDomainEvent(
    string UserId,
    string Email,
    object NotificationPreferences) : DomainEvent;
