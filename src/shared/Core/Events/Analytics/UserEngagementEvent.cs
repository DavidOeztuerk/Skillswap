namespace Events.Analytics;

public record UserEngagementEvent(
    string UserId,
    string FeatureName,
    TimeSpan Duration,
    Dictionary<string, object>? Context);
