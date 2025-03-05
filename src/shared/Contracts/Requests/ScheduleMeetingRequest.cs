namespace Contracts.Requests;

public record ScheduleMeetingRequest(
    Guid MatchSessionId,
    DateTime ScheduledAt);
