namespace Events;

public record UserUpdatedForIntegrationEvent(
    string UserId,
    Dictionary<string, object> UpdatedFields,
    string IntegrationSystem);
