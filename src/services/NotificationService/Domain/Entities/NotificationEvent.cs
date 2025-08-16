using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification events for tracking state changes
/// </summary>
public class NotificationEvent : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string NotificationId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EventType { get; set; } = string.Empty; // Sent, Delivered, Opened, Failed, etc.

    [MaxLength(1000)]
    public string? Details { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // OccurredAt property (alias for Timestamp for compatibility)
    public DateTime OccurredAt => Timestamp;

    // Navigation properties
    public virtual Notification Notification { get; set; } = null!;
}
