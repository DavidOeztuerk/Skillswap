using NotificationService.Domain.Enums;

namespace NotificationService.Domain.Models;

/// <summary>
/// Represents the routing decision for a notification
/// </summary>
public class NotificationRoutingDecision
{
    /// <summary>
    /// Primary channels to use for this notification
    /// </summary>
    public List<NotificationChannel> PrimaryChannels { get; set; } = new();
    
    /// <summary>
    /// Fallback channels if primary channels fail
    /// </summary>
    public List<NotificationChannel> FallbackChannels { get; set; } = new();
    
    /// <summary>
    /// Whether to send immediately or schedule
    /// </summary>
    public bool SendImmediately { get; set; }
    
    /// <summary>
    /// When to send if not immediate
    /// </summary>
    public DateTime? ScheduledFor { get; set; }
    
    /// <summary>
    /// Whether to add to digest instead of sending individually
    /// </summary>
    public bool AddToDigest { get; set; }
    
    /// <summary>
    /// Reason for the routing decision (for debugging/audit)
    /// </summary>
    public string DecisionReason { get; set; } = string.Empty;
    
    /// <summary>
    /// Priority after evaluation
    /// </summary>
    public NotificationPriority EffectivePriority { get; set; }
    
    /// <summary>
    /// Estimated delivery time
    /// </summary>
    public DateTime EstimatedDeliveryTime { get; set; }
    
    /// <summary>
    /// Whether user preferences were overridden (e.g., for critical notifications)
    /// </summary>
    public bool PreferencesOverridden { get; set; }
    
    /// <summary>
    /// Metadata for the routing decision
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Input for routing decision
/// </summary>
public class NotificationRoutingRequest
{
    public string UserId { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; }
    public Dictionary<string, string> Variables { get; set; } = new();
    public string? PreferredChannel { get; set; }
    public DateTime? RequestedDeliveryTime { get; set; }
    public bool AllowDigest { get; set; } = true;
    public bool RespectQuietHours { get; set; } = true;
}