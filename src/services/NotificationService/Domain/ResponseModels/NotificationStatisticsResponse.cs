// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationStatisticsResponse
{
    public PeriodStats Period { get; set; } = new();
    public OverviewStats Overview { get; set; } = new();
    public List<NotificationStatsByType> ByType { get; set; } = new();
    public List<NotificationStatsByTemplate> ByTemplate { get; set; } = new();
    public List<DailyNotificationStats> DailyStats { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}
