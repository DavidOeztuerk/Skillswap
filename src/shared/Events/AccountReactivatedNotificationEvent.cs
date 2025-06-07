namespace Events;

public record AccountReactivatedNotificationEvent(
    string UserId,
    string Email);
