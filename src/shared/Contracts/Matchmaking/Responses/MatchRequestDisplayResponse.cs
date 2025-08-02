namespace Contracts.Matchmaking.Responses;

/// <summary>
/// Display-focused match request response - contains all data needed for UI
/// </summary>
public record MatchRequestDisplayResponse(
    string Id,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string Message,
    string Status, // pending, accepted, rejected, expired
    string Type,   // incoming, outgoing
    
    // Other user info (requester or target based on type)
    string OtherUserId,
    string OtherUserName,
    decimal OtherUserRating,
    string? OtherUserAvatar,
    
    // Exchange info
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,
    
    // Monetary info
    bool IsMonetary,
    decimal? OfferedAmount,
    string? Currency,
    
    // Session details
    int SessionDurationMinutes,
    int TotalSessions,
    string[] PreferredDays,
    string[] PreferredTimes,
    
    // Timestamps
    DateTime CreatedAt,
    DateTime? RespondedAt,
    DateTime? ExpiresAt,
    
    // Thread info
    string? ThreadId,
    
    // UI state
    bool IsRead
)
{
    public string ApiVersion => "v1";
}