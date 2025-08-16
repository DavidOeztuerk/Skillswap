namespace Events.Notification;

public record AccountSuspendedNotificationEvent(
    string UserId,
    string Email,
    string UserName,
    string Reason,
    DateTime SuspendedAt);
