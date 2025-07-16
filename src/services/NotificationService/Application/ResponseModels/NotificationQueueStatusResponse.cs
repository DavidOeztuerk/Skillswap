// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationQueueStatusResponse
{
    public QueueHealthStats OverallHealth { get; set; } = new();
    public List<QueueStatusByType> ByType { get; set; } = new();
    public List<QueueStatusByPriority> ByPriority { get; set; } = new();
    public ProcessingStats Processing { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}
