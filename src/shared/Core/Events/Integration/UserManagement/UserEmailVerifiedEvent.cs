namespace Events.Integration.UserManagement;

// ============================================================================
// USER STATE CHANGE EVENTS (for other services)
// ============================================================================

public record UserEmailVerifiedEvent(
    string UserId,
    string Email);
