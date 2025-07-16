namespace Events.Notification;

public record AccountReactivatedNotificationEvent(
    string UserId,
    string Email);
