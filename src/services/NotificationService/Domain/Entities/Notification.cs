using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification entity for tracking all sent notifications
/// </summary>
public class Notification : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // Email, SMS, Push

    [Required]
    [MaxLength(100)]
    public string Template { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Recipient { get; set; } = string.Empty; // Email address, phone number, etc.

    [Required]
    [MaxLength(500)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty; // Full message content

    [MaxLength(50)]
    public string Status { get; set; } = NotificationStatus.Pending;

    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    public int RetryCount { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }

    [MaxLength(100)]
    public string? ExternalId { get; set; } // Provider-specific ID

    [MaxLength(50)]
    public string Priority { get; set; } = NotificationPriority.Normal;

    // Metadata as JSON
    public string? MetadataJson { get; set; }

    // Navigation properties
    public virtual ICollection<NotificationEvent> Events { get; set; } = new List<NotificationEvent>();
}
