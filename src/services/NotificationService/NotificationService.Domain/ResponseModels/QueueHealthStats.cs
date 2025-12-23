// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class QueueHealthStats
{
    public int TotalPending { get; set; }
    public int TotalProcessing { get; set; }
    public int TotalFailed { get; set; }
    public int RetryQueue { get; set; }
    public int DeadLetterQueue { get; set; }
    public double AverageProcessingTime { get; set; }
    public string HealthStatus { get; set; } = "Healthy"; // Healthy, Warning, Critical
}
