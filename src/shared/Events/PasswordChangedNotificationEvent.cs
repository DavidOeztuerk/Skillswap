namespace Events;

public record PasswordChangedNotificationEvent(
    string UserId,
    string Email);
