namespace Events;

public record AccountSuspendedNotificationEvent(
    string UserId,
    string Email,
    string Reason);
