namespace Events.Security.Authentication;

public record PasswordChangedNotificationEvent(
    string UserId,
    string Email);
