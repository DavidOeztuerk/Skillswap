namespace Contracts.Events;

public record UserEmailVerificationRequestedEvent(
    string UserId,
    string Email,
    string VerificationCode,
    string UserName,
    DateTime ExpiresAt,
    DateTime Timestamp);