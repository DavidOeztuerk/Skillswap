namespace SkillService.Domain.Entities;

/// <summary>
/// Status constants for skill listings
/// </summary>
public static class ListingStatus
{
    /// <summary>
    /// Listing is active and visible in search
    /// </summary>
    public const string Active = "Active";

    /// <summary>
    /// Listing is about to expire (7 days or less remaining)
    /// Still visible, user has been notified
    /// </summary>
    public const string Expiring = "Expiring";

    /// <summary>
    /// Listing has expired and is no longer visible in search
    /// Will be hard-deleted after grace period
    /// </summary>
    public const string Expired = "Expired";

    /// <summary>
    /// Listing was manually closed by the user
    /// </summary>
    public const string Closed = "Closed";

    /// <summary>
    /// Listing has been soft-deleted
    /// Will be hard-deleted after retention period
    /// </summary>
    public const string Deleted = "Deleted";

    /// <summary>
    /// All valid statuses for validation
    /// </summary>
    public static readonly string[] All = [Active, Expiring, Expired, Closed, Deleted];

    /// <summary>
    /// Statuses where the listing is visible in public search
    /// </summary>
    public static readonly string[] Visible = [Active, Expiring];

    /// <summary>
    /// Checks if status allows the listing to be visible
    /// </summary>
    public static bool IsVisible(string status) =>
        status == Active || status == Expiring;
}
