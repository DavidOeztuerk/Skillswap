namespace Events;

public record UserDeactivatedForIntegrationEvent(
    string UserId,
    string Reason,
    string IntegrationSystem);