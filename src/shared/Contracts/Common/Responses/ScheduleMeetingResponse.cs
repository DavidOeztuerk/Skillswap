namespace Contracts.Responses;

public record ScheduleMeetingResponse(
    string MeetingId,
    string MatchSessionId,
    DateTime ScheduledAt);
