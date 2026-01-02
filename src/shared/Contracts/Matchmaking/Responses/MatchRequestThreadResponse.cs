namespace Contracts.Matchmaking.Responses;

/// <summary>
/// Response for GetMatchRequestThread operation
/// </summary>
public class MatchRequestThreadResponse
{
    public string ThreadId { get; set; } = string.Empty;
    public string SkillId { get; set; } = string.Empty;
    public string SkillName { get; set; } = string.Empty;
    public string SkillCategory { get; set; } = string.Empty;
    public string RequesterId { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public decimal RequesterRating { get; set; }
    public string TargetUserId { get; set; } = string.Empty;
    public string TargetUserName { get; set; } = string.Empty;
    public decimal TargetUserRating { get; set; }
    public List<MatchRequestInThread> Requests { get; set; } = [];
    public DateTime LastActivity { get; set; }
    public string LastStatus { get; set; } = string.Empty;

    // Counter-Offer Limit Info
    /// <summary>
    /// Thread status: Active, AgreementReached, NoAgreement, Expired
    /// </summary>
    public string ThreadStatus { get; set; } = "Active";

    /// <summary>
    /// How many more requests the initiator (first requester) can make.
    /// Initiator limit: 3 total (1 initial + 2 counter-offers)
    /// </summary>
    public int InitiatorRemainingRequests { get; set; } = 2;

    /// <summary>
    /// How many more requests the owner (skill owner) can make.
    /// Owner limit: 3 counter-offers
    /// </summary>
    public int OwnerRemainingRequests { get; set; } = 3;

    /// <summary>
    /// Total remaining requests for the thread before it's locked.
    /// Max 6 total requests per thread.
    /// </summary>
    public int TotalRemainingRequests { get; set; } = 5;

    /// <summary>
    /// True if the thread has reached the maximum of 6 requests.
    /// </summary>
    public bool IsLocked { get; set; } = false;
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