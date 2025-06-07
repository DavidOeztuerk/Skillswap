namespace Events;

public record PasswordResetEmailEvent(
    string UserId,
    string Email,
    string ResetToken,
    string FirstName);
