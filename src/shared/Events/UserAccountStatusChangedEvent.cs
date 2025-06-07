namespace Events;

public record UserAccountStatusChangedEvent(
    string UserId,
    string Email,
    string OldStatus,
    string NewStatus,
    string? Reason);
