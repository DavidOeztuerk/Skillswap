namespace Events.Integration.Communication;

public record VideoCallQualityEvent(
    string SessionId,
    string UserId,
    DateTime Timestamp,
    Dictionary<string, double> QualityMetrics,
    string QualityLevel,
    bool RequiresOptimization = false
);
