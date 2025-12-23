// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class QueueStatusByType
{
    public string Type { get; set; } = string.Empty;
    public int Pending { get; set; }
    public int Processing { get; set; }
    public int Failed { get; set; }
    public double AverageProcessingTime { get; set; }
}
