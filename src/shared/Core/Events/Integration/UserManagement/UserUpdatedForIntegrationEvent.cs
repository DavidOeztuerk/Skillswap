namespace Events.Integration.UserManagement;

public record UserUpdatedForIntegrationEvent(
    string UserId,
    Dictionary<string, object> UpdatedFields,
    string IntegrationSystem);
