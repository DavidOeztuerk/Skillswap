namespace Events.Integration.AppointmentManagement;

public record MeetingScheduledEvent(
    Guid MeetingId,
    Guid MatchSessionId,
    DateTime ScheduledAt);
