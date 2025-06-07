namespace Events;

// ============================================================================
// EMAIL NOTIFICATION EVENTS
// ============================================================================

public record EmailVerificationRequestedEvent(
    string UserId,
    string Email,
    string VerificationToken,
    string FirstName);
