namespace UserService.Domain.Models;

/// <summary>
/// Account status constants
/// </summary>
public static class AccountStatus
{
    public const string PendingVerification = "PendingVerification";
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Suspended = "Suspended";
    public const string Deleted = "Deleted";
}
