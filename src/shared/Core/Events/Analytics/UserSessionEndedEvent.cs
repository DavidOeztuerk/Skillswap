namespace Events.Analytics;

public record UserSessionEndedEvent(
    string UserId,
    string SessionId,
    string? EndReason);
