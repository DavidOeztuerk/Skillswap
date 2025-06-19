namespace SkillService.Domain.Entities;

/// <summary>
/// Status constants for skill matches
/// </summary>
public static class MatchStatus
{
    public const string Pending = "Pending";
    public const string Accepted = "Accepted";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Expired = "Expired";
}
