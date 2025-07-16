namespace Events.Security.Authentication;

// ============================================================================
// EMAIL NOTIFICATION EVENTS
// ============================================================================

public record EmailVerificationRequestedEvent(
    string UserId,
    string Email,
    string VerificationToken,
    string FirstName);
