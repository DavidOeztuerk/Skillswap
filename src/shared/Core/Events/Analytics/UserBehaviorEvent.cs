namespace Events.Analytics;

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

public record UserBehaviorEvent(
    string UserId,
    string EventType,
    string PageOrFeature,
    Dictionary<string, object>? Properties,
    DateTime Timestamp);
