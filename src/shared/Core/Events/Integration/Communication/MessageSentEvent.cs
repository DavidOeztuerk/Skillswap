namespace Events.Integration.Communication;

public record MessageSentEvent(
    Guid MessageId,
    Guid MatchSessionId,
    string Message,
    DateTime SentAt);
