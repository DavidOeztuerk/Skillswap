namespace NotificationService.Domain.Enums;

/// <summary>
/// Defines the priority levels for notifications
/// </summary>
public enum NotificationPriority
{
    /// <summary>
    /// Low priority - can be batched/delayed (newsletters, marketing)
    /// </summary>
    Low = 0,
    
    /// <summary>
    /// Normal priority - send within reasonable time (reminders, updates)
    /// </summary>
    Normal = 1,
    
    /// <summary>
    /// High priority - send quickly (appointments, important updates)
    /// </summary>
    High = 2,
    
    /// <summary>
    /// Critical priority - send immediately, override quiet hours (security, verification)
    /// </summary>
    Critical = 3
}