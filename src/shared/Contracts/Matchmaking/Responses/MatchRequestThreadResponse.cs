namespace Contracts.Matchmaking.Responses;

/// <summary>
/// Response for GetMatchRequestThread operation
/// </summary>
public class MatchRequestThreadResponse
{
    public string ThreadId { get; set; } = string.Empty;
    public string SkillId { get; set; } = string.Empty;
    public string RequesterId { get; set; } = string.Empty;
    public string TargetUserId { get; set; } = string.Empty;
    public List<MatchRequestInThread> Requests { get; set; } = [];
    public DateTime LastActivity { get; set; }
    public string LastStatus { get; set; } = string.Empty;
}


public class MatchRequestInThread
{
    public string Id { get; set; } = string.Empty;
    public string RequesterId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsSkillExchange { get; set; }
    public bool IsMonetary { get; set; }
    public decimal? OfferedAmount { get; set; }
    public List<string> PreferredDays { get; set; } = new();
    public List<string> PreferredTimes { get; set; } = new();
    public int SessionDuration { get; set; }
    public int TotalSessions { get; set; }
    public DateTime CreatedAt { get; set; }
}