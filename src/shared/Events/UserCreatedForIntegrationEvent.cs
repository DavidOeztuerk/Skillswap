namespace Events;

// ============================================================================
// INTEGRATION EVENTS (for external systems)
// ============================================================================

public record UserCreatedForIntegrationEvent(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    List<string> Roles,
    string IntegrationSystem);
