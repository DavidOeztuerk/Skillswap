// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationDetailsResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public int RetryCount { get; set; }
    public DateTime? NextRetryAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ExternalId { get; set; }
    public Dictionary<string, string> Variables { get; set; } = new();
    public List<NotificationEventResponse> Events { get; set; } = new();
}
