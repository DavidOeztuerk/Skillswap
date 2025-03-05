namespace Events;

public record MeetingScheduledEvent(
    Guid MeetingId,
    Guid MatchSessionId,
    DateTime ScheduledAt);
