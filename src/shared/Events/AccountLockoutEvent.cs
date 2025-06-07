namespace Events;

public record AccountLockoutEvent(
    string UserId,
    string Email,
    string Reason,
    DateTime LockoutUntil);
