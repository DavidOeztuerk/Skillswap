namespace Events;

// ============================================================================
// ADMIN OPERATION EVENTS
// ============================================================================

public record AdminActionPerformedEvent(
    string AdminUserId,
    string TargetUserId,
    string ActionType,
    string Description,
    Dictionary<string, object>? Metadata);
