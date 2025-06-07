namespace Events;

public record WelcomeEmailEvent(
    string UserId,
    string Email);
