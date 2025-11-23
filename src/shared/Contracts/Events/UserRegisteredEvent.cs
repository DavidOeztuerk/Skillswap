namespace Contracts.Events;

/// <summary>
/// Integration event raised when a new user registers.
/// This event does NOT contain sensitive information like verification codes.
/// Used for audit logs, analytics, and notifications.
/// </summary>
public record UserRegisteredEvent(
    string UserId,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    DateTime Timestamp);
