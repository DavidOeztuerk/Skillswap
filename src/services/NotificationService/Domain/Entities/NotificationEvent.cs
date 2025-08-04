using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;
using Infrastructure.Models;

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

    // Navigation properties
    public virtual Notification Notification { get; set; } = null!;
}
