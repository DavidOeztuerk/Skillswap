namespace Events.Notification;

public record AccountSuspendedNotificationEvent(
    string UserId,
    string Email,
    string Reason);
