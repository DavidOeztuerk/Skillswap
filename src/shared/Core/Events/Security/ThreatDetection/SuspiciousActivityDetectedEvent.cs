namespace Events.Security.ThreatDetection;

// ============================================================================
// SUSPICIOUS ACTIVITY EVENTS
// ============================================================================

public record SuspiciousActivityDetectedEvent(
    string UserId,
    string Email,
    string ActivityType,
    string IpAddress,
    int FailedAttemptCount);
