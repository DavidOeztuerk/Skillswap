namespace Events;

// ============================================================================
// COMPLIANCE & GDPR EVENTS
// ============================================================================

public record DataRetentionPolicyAppliedEvent(
    string UserId,
    string PolicyType,
    DateTime RetentionUntil);
