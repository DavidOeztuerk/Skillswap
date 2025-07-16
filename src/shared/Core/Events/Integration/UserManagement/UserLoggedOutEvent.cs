namespace Events.Integration.UserManagement;

public record UserLoggedOutEvent(
    string UserId,
    string? Reason);
