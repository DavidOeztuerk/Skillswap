namespace NotificationService.Domain.Entities;

/// <summary>
/// Campaign status constants
/// </summary>
public static class CampaignStatus
{
    public const string Draft = "Draft";
    public const string Scheduled = "Scheduled";
    public const string Running = "Running";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Failed = "Failed";
}
