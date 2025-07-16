namespace Events.Integration.Communication;

public record CallTerminatedEvent(
    Guid CallId);
