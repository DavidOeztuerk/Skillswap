using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;
using Infrastructure.Models;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification campaigns for bulk notifications
/// </summary>
public class NotificationCampaign : AuditableEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // Email, SMS, Push

    [Required]
    [MaxLength(100)]
    public string Template { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = CampaignStatus.Draft;

    public DateTime? ScheduledAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Target audience criteria as JSON
    public string? TargetCriteria { get; set; }

    // Campaign variables as JSON
    public string? VariablesJson { get; set; }

    // Statistics
    public int TotalTargets { get; set; } = 0;
    public int SentCount { get; set; } = 0;
    public int DeliveredCount { get; set; } = 0;
    public int FailedCount { get; set; } = 0;
    public int OpenedCount { get; set; } = 0;
    public int ClickedCount { get; set; } = 0;
}
