namespace Events.Notification;

public record WelcomeEmailEvent(
    string UserId,
    string Email,
    string FirstName);
