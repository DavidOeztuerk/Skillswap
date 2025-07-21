namespace Events.Integration.Monitoring;

public record PerformanceThresholdExceededEvent(
    string ServiceName,
    string MetricName,
    double CurrentValue,
    double ThresholdValue,
    DateTime Timestamp,
    string Severity,
    Dictionary<string, object>? AdditionalData = null
);
