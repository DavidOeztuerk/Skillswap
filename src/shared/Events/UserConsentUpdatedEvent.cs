namespace Events;

public record UserConsentUpdatedEvent(
    string UserId,
    Dictionary<string, bool> ConsentSettings,
    DateTime UpdatedAt);
