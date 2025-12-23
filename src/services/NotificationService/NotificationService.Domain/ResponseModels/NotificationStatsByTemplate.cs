// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationStatsByTemplate
{
    public string Template { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Sent { get; set; }
    public int Failed { get; set; }
}
