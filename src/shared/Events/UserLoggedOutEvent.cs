namespace Events;

public record UserLoggedOutEvent(
    string UserId,
    string? Reason);
