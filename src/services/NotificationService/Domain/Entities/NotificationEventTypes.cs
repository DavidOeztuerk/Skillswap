namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification event types
/// </summary>
public static class NotificationEventTypes
{
    public const string Queued = "Queued";
    public const string Sent = "Sent";
    public const string Delivered = "Delivered";
    public const string Bounced = "Bounced";
    public const string Opened = "Opened";
    public const string Clicked = "Clicked";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";
    public const string Retry = "Retry";
}
