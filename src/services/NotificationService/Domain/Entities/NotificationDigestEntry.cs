namespace NotificationService.Domain.Entities;

/// <summary>
/// Represents a notification entry that should be included in a digest
/// </summary>
public class NotificationDigestEntry
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public string Variables { get; set; } = string.Empty; // JSON serialized variables
    public DateTime CreatedAt { get; set; }
    public bool IsProcessed { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? DigestNotificationId { get; set; } // Reference to the digest notification that included this entry
}