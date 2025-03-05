namespace Events;

public record CallInitiatedEvent(
    Guid CallId,
    Guid MatchSessionId);

