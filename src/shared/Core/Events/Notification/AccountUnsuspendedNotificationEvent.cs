namespace Events.Notification;

public record AccountUnsuspendedNotificationEvent(
    string UserId,
    string Email,
    string UserName,
    DateTime UnsuspendedAt);
