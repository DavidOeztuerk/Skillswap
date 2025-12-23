namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification metadata for rich content
/// </summary>
public class NotificationMetadata
{
    public Dictionary<string, string> Variables { get; set; } = new();
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? CorrelationId { get; set; }
    public string? SourceEvent { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public List<string> Tags { get; set; } = new();
    public Dictionary<string, object> CustomData { get; set; } = new();
}