namespace NotificationService.Domain.Entities;

/// <summary>
/// Notification status constants
/// </summary>
public static class NotificationStatus
{
    public const string Pending = "Pending";
    public const string Sent = "Sent";
    public const string Delivered = "Delivered";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";
    public const string Read = "Read";
}
