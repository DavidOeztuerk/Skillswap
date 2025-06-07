namespace Events;

// ============================================================================
// AUDIT TRAIL EVENTS
// ============================================================================

public record UserDataAccessedEvent(
    string AccessedByUserId,
    string TargetUserId,
    string DataType,
    string AccessReason);
