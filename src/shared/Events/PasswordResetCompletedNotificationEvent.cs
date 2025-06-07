namespace Events;

public record PasswordResetCompletedNotificationEvent(
    string UserId,
    string Email);
