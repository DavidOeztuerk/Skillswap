namespace Events.Integration.Analytics;

public record UserActivityTrackedEvent(
    string UserId,
    string ActivityType,
    DateTime Timestamp,
    string ServiceName,
    Dictionary<string, object> ActivityData,
    string? SessionId = null,
    TimeSpan? Duration = null
);
