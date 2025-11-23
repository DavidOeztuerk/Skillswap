// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class ProcessingStats
{
    public int ProcessedLastHour { get; set; }
    public int ProcessedLast24Hours { get; set; }
    public int FailedLastHour { get; set; }
    public int FailedLast24Hours { get; set; }
    public double ThroughputPerMinute { get; set; }
    public double ErrorRate { get; set; }
}