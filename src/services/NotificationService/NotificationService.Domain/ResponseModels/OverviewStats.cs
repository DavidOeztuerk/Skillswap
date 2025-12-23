// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class OverviewStats
{
    public int TotalNotifications { get; set; }
    public int SentNotifications { get; set; }
    public int DeliveredNotifications { get; set; }
    public int FailedNotifications { get; set; }
    public int PendingNotifications { get; set; }
    public double SuccessRate { get; set; }
    public double FailureRate { get; set; }
}
