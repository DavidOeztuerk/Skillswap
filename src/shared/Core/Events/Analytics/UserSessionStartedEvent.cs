namespace Events.Analytics;

// ============================================================================
// SESSION MANAGEMENT EVENTS
// ============================================================================

public record UserSessionStartedEvent(
    string UserId,
    string SessionId,
    string IpAddress,
    string? DeviceInfo);
