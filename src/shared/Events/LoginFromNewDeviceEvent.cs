namespace Events;

// ============================================================================
// SECURITY MONITORING EVENTS
// ============================================================================

public record LoginFromNewDeviceEvent(
    string UserId,
    string Email,
    string IpAddress,
    string DeviceInfo);
