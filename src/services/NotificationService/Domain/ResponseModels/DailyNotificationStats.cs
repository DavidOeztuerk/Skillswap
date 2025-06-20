// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class DailyNotificationStats
{
    public DateTime Date { get; set; }
    public int Total { get; set; }
    public int Sent { get; set; }
    public int Failed { get; set; }
}
