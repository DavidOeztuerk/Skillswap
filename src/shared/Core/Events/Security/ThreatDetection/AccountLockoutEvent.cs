namespace Events.Security.ThreatDetection;

public record AccountLockoutEvent(
    string UserId,
    string Email,
    string Reason,
    DateTime LockoutUntil);
