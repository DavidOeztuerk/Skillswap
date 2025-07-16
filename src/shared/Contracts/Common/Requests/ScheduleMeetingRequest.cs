namespace Contracts.Requests;

public record ScheduleMeetingRequest(
    string MatchSessionId,
    DateTime ScheduledAt);
