namespace Events.Integration.Monitoring;

public record ServiceHealthChangedEvent(
    string ServiceName,
    string PreviousStatus,
    string CurrentStatus,
    DateTime Timestamp,
    string? ErrorMessage = null,
    Dictionary<string, object>? HealthDetails = null
);
