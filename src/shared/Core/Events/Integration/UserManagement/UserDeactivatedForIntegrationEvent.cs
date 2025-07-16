namespace Events.Integration.UserManagement;

public record UserDeactivatedForIntegrationEvent(
    string UserId,
    string Reason,
    string IntegrationSystem);