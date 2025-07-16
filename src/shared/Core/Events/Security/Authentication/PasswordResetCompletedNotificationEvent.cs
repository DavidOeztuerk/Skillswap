namespace Events.Security.Authentication;

public record PasswordResetCompletedNotificationEvent(
    string UserId,
    string Email);
