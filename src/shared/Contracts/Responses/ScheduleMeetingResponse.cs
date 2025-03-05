namespace Contracts.Responses;

public record ScheduleMeetingResponse(
    Guid MeetingId,
    Guid MatchSessionId,
    DateTime ScheduledAt);
