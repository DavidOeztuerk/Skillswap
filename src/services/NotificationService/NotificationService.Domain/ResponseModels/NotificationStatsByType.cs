// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationStatsByType
{
    public string Type { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Sent { get; set; }
    public int Failed { get; set; }
}
