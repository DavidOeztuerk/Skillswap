namespace Events.Integration.Analytics;

public record ServiceMetricsCollectedEvent(
    string ServiceName,
    DateTime Timestamp,
    Dictionary<string, double> Metrics,
    Dictionary<string, string> Tags,
    string? CorrelationId = null
);
