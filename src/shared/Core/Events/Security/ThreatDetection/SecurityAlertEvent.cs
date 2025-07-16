namespace Events.Security.ThreatDetection;

public record SecurityAlertEvent(
    string UserId,
    string Email,
    string ActivityType,
    string IpAddress);
