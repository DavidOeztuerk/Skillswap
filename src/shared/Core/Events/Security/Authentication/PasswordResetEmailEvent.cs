namespace Events.Security.Authentication;

public record PasswordResetEmailEvent(
    string UserId,
    string Email,
    string ResetToken,
    string FirstName);
