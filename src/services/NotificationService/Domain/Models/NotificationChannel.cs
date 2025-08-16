namespace NotificationService.Domain.Models;

/// <summary>
/// Represents available notification channels
/// </summary>
[Flags]
public enum NotificationChannel
{
    None = 0,
    Email = 1,
    SMS = 2,
    Push = 4,
    InApp = 8,
    All = Email | SMS | Push | InApp
}

/// <summary>
/// Information about a specific notification channel for a user
/// </summary>
public class UserChannelInfo
{
    public NotificationChannel Channel { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsVerified { get; set; }
    public bool IsPreferred { get; set; }
    public string? Address { get; set; } // Email address, phone number, device token, etc.
    public DateTime? LastUsedAt { get; set; }
    public double SuccessRate { get; set; } = 1.0; // Track delivery success rate
    public int Priority { get; set; } // Order preference for fallback
}