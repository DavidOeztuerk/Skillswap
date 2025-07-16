namespace Events.Integration.Communication;

public record CallInitiatedEvent(
    Guid CallId,
    Guid MatchSessionId);

