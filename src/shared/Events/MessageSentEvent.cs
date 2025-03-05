namespace Events;

public record MessageSentEvent(
    Guid MessageId,
    Guid MatchSessionId,
    string Message,
    DateTime SentAt);
