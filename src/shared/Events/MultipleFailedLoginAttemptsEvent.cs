namespace Events;

public record MultipleFailedLoginAttemptsEvent(
    string Email,
    string IpAddress,
    int AttemptCount,
    DateTime WindowStart,
    DateTime WindowEnd);
