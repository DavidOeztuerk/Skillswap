using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;
using NotificationService.Domain.Enums;

namespace NotificationService.Domain.Entities;

public class Notification : AuditableEntity
{
    [Required, MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Template { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Recipient { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = NotificationStatus.Pending.ToString();

    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }

    [NotMapped]
    public bool IsRead => ReadAt != null; // helper if needed

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    public int RetryCount { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }

    [MaxLength(100)]
    public string? ExternalId { get; set; }

    [MaxLength(50)]
    public string Priority { get; set; } = NotificationPriority.Normal.ToString();

    public DateTime? ScheduledAt { get; set; }

    public string? Variables { get; set; }
    public string? MetadataJson { get; set; }

    public virtual ICollection<NotificationEvent> Events { get; set; } = new List<NotificationEvent>();
}
