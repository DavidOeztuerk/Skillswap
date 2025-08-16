namespace Events.Integration.Matchmaking;

public record MatchRequestCreatedIntegrationEvent
{
    public string RequestId { get; init; }
    public string RequesterId { get; init; }
    public string RequesterName { get; init; }
    public string TargetUserId { get; init; }
    public string TargetUserName { get; init; }
    public string SkillId { get; init; }
    public string SkillName { get; init; }
    public string Message { get; init; }
    public bool IsSkillExchange { get; init; }
    public string? ExchangeSkillId { get; init; }
    public string? ExchangeSkillName { get; init; }
    public bool IsMonetary { get; init; }
    public decimal? OfferedAmount { get; init; }
    public string? Currency { get; init; }
    public int SessionDurationMinutes { get; init; }
    public int TotalSessions { get; init; }
    public string[] PreferredDays { get; init; }
    public string[] PreferredTimes { get; init; }
    public string ThreadId { get; init; }
    public DateTime CreatedAt { get; init; }

    public MatchRequestCreatedIntegrationEvent(
        string requestId,
        string requesterId,
        string requesterName,
        string targetUserId,
        string targetUserName,
        string skillId,
        string skillName,
        string message,
        bool isSkillExchange,
        string? exchangeSkillId,
        string? exchangeSkillName,
        bool isMonetary,
        decimal? offeredAmount,
        string? currency,
        int sessionDurationMinutes,
        int totalSessions,
        string[] preferredDays,
        string[] preferredTimes,
        string threadId,
        DateTime createdAt)
    {
        RequestId = requestId;
        RequesterId = requesterId;
        RequesterName = requesterName;
        TargetUserId = targetUserId;
        TargetUserName = targetUserName;
        SkillId = skillId;
        SkillName = skillName;
        Message = message;
        IsSkillExchange = isSkillExchange;
        ExchangeSkillId = exchangeSkillId;
        ExchangeSkillName = exchangeSkillName;
        IsMonetary = isMonetary;
        OfferedAmount = offeredAmount;
        Currency = currency;
        SessionDurationMinutes = sessionDurationMinutes;
        TotalSessions = totalSessions;
        PreferredDays = preferredDays;
        PreferredTimes = preferredTimes;
        ThreadId = threadId;
        CreatedAt = createdAt;
    }
}