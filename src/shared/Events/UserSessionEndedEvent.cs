namespace Events;

public record UserSessionEndedEvent(
    string UserId,
    string SessionId,
    string? EndReason);
