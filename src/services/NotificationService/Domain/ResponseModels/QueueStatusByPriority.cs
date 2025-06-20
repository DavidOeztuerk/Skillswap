// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class QueueStatusByPriority
{
    public string Priority { get; set; } = string.Empty;
    public int Pending { get; set; }
    public int Processing { get; set; }
    public double AverageWaitTime { get; set; }
}
