namespace Events.Security.Authentication;

public record LoginFromNewLocationEvent(
    string UserId,
    string Email,
    string IpAddress);
