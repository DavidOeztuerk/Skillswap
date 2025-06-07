namespace Events;

public record LoginFromNewLocationEvent(
    string UserId,
    string Email,
    string IpAddress,
    string? Location);
